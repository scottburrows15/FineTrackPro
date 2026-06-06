import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { eq } from "drizzle-orm";

import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { db, pool } from "./db";
import { users } from "@shared/schema";

const TEST_PREFIX = "auth-test-";
const password = "Sup3rSecret!";

function uniqueEmail() {
  return `${TEST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
}

async function buildApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Real session/passport auth + login/register/logout endpoints.
  await setupAuth(app);

  // Mirror of the production protected route (server/routes.ts) so the test
  // exercises the same isAuthenticated guard + passwordHash stripping.
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      if (user) {
        const { passwordHash, ...safeUser } = user as any;
        return res.json(safeUser);
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Helper route to inspect the raw session-user shape (the session contract).
  app.get("/api/__test__/session-user", isAuthenticated, (req: any, res) => {
    res.json(req.user);
  });

  return app;
}

let app: Express;
const createdEmails = new Set<string>();

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  for (const email of createdEmails) {
    await db.delete(users).where(eq(users.email, email));
  }
  await pool.end();
});

describe("auth: register", () => {
  it("creates an account, returns 201, and sets a session", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    const agent = request.agent(app);
    const res = await agent
      .post("/api/register")
      .send({ email, password, firstName: "Ada" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email });
    expect(res.body.id).toBeTruthy();
    // Session cookie must be set so subsequent requests are authenticated.
    expect(res.headers["set-cookie"]).toBeDefined();

    // The new session immediately authorizes a protected route.
    const me = await agent.get("/api/auth/user");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it("rejects a duplicate email with 400", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    const first = await request(app)
      .post("/api/register")
      .send({ email, password, firstName: "Grace" });
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post("/api/register")
      .send({ email, password, firstName: "Grace" });
    expect(dup.status).toBe(400);
    expect(dup.body.message).toMatch(/already exists/i);
  });

  it("rejects an invalid body (short password) with 400", async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post("/api/register")
      .send({ email, password: "short", firstName: "Lin" });
    expect(res.status).toBe(400);
  });
});

describe("auth: login", () => {
  it("logs in with the correct password and sets a session", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    await request(app)
      .post("/api/register")
      .send({ email, password, firstName: "Edsger" });

    const agent = request.agent(app);
    const res = await agent.post("/api/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email });
    expect(res.headers["set-cookie"]).toBeDefined();

    const me = await agent.get("/api/auth/user");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it("rejects a wrong password with 401", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    await request(app)
      .post("/api/register")
      .send({ email, password, firstName: "Tony" });

    const res = await request(app)
      .post("/api/login")
      .send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: uniqueEmail(), password });
    expect(res.status).toBe(401);
  });
});

describe("auth: protected route + session contract", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/auth/user");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/unauthorized/i);
  });

  it("returns the user WITHOUT passwordHash", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    const agent = request.agent(app);
    await agent.post("/api/register").send({ email, password, firstName: "Hopper" });

    const me = await agent.get("/api/auth/user");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
    expect(me.body).not.toHaveProperty("passwordHash");
  });

  it("stores the session user shaped as { claims: { sub, ... } }", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    const agent = request.agent(app);
    const reg = await agent
      .post("/api/register")
      .send({ email, password, firstName: "Margaret" });
    const userId = reg.body.id;

    const res = await agent.get("/api/__test__/session-user");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("claims");
    expect(res.body.claims.sub).toBe(userId);
    expect(res.body.claims.email).toBe(email);
    expect(res.body.claims).toHaveProperty("first_name");
    expect(res.body.claims).toHaveProperty("last_name");
    expect(res.body.claims).toHaveProperty("profile_image_url");
    expect(res.body).toHaveProperty("expires_at");
  });
});

describe("auth: logout", () => {
  it("clears the session so protected routes return 401", async () => {
    const email = uniqueEmail();
    createdEmails.add(email);

    const agent = request.agent(app);
    await agent.post("/api/register").send({ email, password, firstName: "Alan" });

    const before = await agent.get("/api/auth/user");
    expect(before.status).toBe(200);

    // /api/logout redirects to "/" after destroying the session.
    const out = await agent.get("/api/logout").redirects(0);
    expect(out.status).toBe(302);

    const after = await agent.get("/api/auth/user");
    expect(after.status).toBe(401);
  });
});
