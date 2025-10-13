import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import express from "express";
import { insertFineSchema, insertFineCategorySchema, insertFineSubcategorySchema } from "@shared/schema";

// Use dummy Stripe key for testing if not provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_testing';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-07-30.basil",
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Team routes
  app.post('/api/teams/join', isAuthenticated, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      const userId = req.user.claims.sub;
      
      const team = await storage.getTeamByInviteCode(inviteCode);
      if (!team) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's team
      const updatedUser = await storage.upsertUser({
        ...user,
        teamId: team.id,
      });

      await storage.createAuditLog({
        entityType: 'user',
        entityId: userId,
        action: 'join_team',
        userId,
        changes: { teamId: team.id },
      });

      res.json({ team, user: updatedUser });
    } catch (error) {
      console.error("Error joining team:", error);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  // Auto-join via share link route
  app.get('/api/teams/join/:inviteCode', isAuthenticated, async (req: any, res) => {
    try {
      const { inviteCode } = req.params;
      const userId = req.user.claims.sub;
      
      const team = await storage.getTeamByInviteCode(inviteCode);
      if (!team) {
        return res.status(404).json({ message: "Invalid invite code or team not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already in a team
      if (user.teamId) {
        return res.status(400).json({ message: "You are already a member of a team" });
      }

      // Update user's team
      const updatedUser = await storage.upsertUser({
        ...user,
        teamId: team.id,
        role: 'player',
      });

      res.json({ 
        message: `Successfully joined ${team.name}`,
        team,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error auto-joining team:", error);
      res.status(500).json({ message: "Failed to join team" });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const { name } = req.body;
      const userId = req.user.claims.sub;

      const inviteCode = storage.generateInviteCode();
      const team = await storage.createTeam({
        name,
        inviteCode,
      });

      // Update user to be admin of this team
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          teamId: team.id,
          role: 'admin',
        });
      }

      // Create default categories
      const trainingCategory = await storage.createFineCategory({
        teamId: team.id,
        name: "Training",
        color: "#1E40AF",
        sortOrder: 0,
      });

      const matchCategory = await storage.createFineCategory({
        teamId: team.id,
        name: "Match Day",
        color: "#DC2626",
        sortOrder: 1,
      });

      const socialCategory = await storage.createFineCategory({
        teamId: team.id,
        name: "Social",
        color: "#7C3AED",
        sortOrder: 2,
      });

      // Create default subcategories
      await storage.createFineSubcategory({
        categoryId: trainingCategory.id,
        name: "Late Arrival",
        defaultAmount: "5.00",
        icon: "fas fa-clock",
        sortOrder: 0,
      });

      await storage.createFineSubcategory({
        categoryId: matchCategory.id,
        name: "Red Card",
        defaultAmount: "32.50",
        icon: "fas fa-square",
        sortOrder: 0,
      });

      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Team info route
  app.get('/api/team/info', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.teamId) {
        return res.status(404).json({ message: "User not in a team" });
      }

      const team = await storage.getTeamById(user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      res.json(team);
    } catch (error) {
      console.error("Error fetching team info:", error);
      res.status(500).json({ message: "Failed to fetch team info" });
    }
  });

  // Fine routes
  app.get('/api/fines/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fines = await storage.getUserFines(userId);
      res.json(fines);
    } catch (error) {
      console.error("Error fetching user fines:", error);
      res.status(500).json({ message: "Failed to fetch fines" });
    }
  });

  // Team fines route for admin dashboard
  app.get('/api/fines/team', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      
      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const fines = await storage.getTeamFines(user.teamId);
      res.json(fines);
    } catch (error) {
      console.error("Error fetching team fines:", error);
      res.status(500).json({ message: "Failed to fetch team fines" });
    }
  });

  app.post('/api/fines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validation = insertFineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid fine data", errors: validation.error.issues });
      }

      const fine = await storage.createFine({
        ...validation.data,
        issuedBy: userId,
      });

      // Create notification for player
      await storage.createNotification({
        userId: fine.playerId,
        title: "New Fine Issued",
        message: `You have received a new fine of £${fine.amount}`,
        type: "fine_issued",
        relatedEntityId: fine.id,
      });

      // Create audit log
      await storage.createAuditLog({
        entityType: 'fine',
        entityId: fine.id,
        action: 'create',
        userId,
        changes: validation.data,
      });

      res.json(fine);
    } catch (error) {
      console.error("Error creating fine:", error);
      res.status(500).json({ message: "Failed to create fine" });
    }
  });

  // Bulk fine creation route
  app.post('/api/fines/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const { playerIds, subcategoryId, amount, description } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);

      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
        return res.status(400).json({ message: "Player IDs are required" });
      }

      const fines = [];
      
      for (const playerId of playerIds) {
        const fine = await storage.createFine({
          playerId,
          subcategoryId,
          amount: amount.toString(),
          description,
          issuedBy: userId,
        });

        // Create notification for each player
        await storage.createNotification({
          userId: playerId,
          title: "New Fine Issued",
          message: `You have received a new fine of £${amount}`,
          type: "fine_issued",
          relatedEntityId: fine.id,
        });

        // Create audit log for each fine
        await storage.createAuditLog({
          entityType: 'fine',
          entityId: fine.id,
          action: 'create',
          userId,
          changes: { playerId, subcategoryId, amount, description },
        });

        fines.push(fine);
      }

      res.json({ 
        message: `Successfully issued ${fines.length} fines`,
        fines 
      });
    } catch (error) {
      console.error("Error creating bulk fines:", error);
      res.status(500).json({ message: "Failed to create bulk fines" });
    }
  });

  // Categories routes
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      
      if (!user?.teamId) {
        return res.status(404).json({ message: "User not in a team" });
      }

      const categories = await storage.getTeamCategoriesWithCounts(user.teamId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:id/subcategories', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const subcategories = await storage.getCategorySubcategories(id);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  // Alternative route for subcategories (matches frontend expectations)
  app.get('/api/subcategories/:categoryId', isAuthenticated, async (req: any, res) => {
    try {
      const { categoryId } = req.params;
      const subcategories = await storage.getCategorySubcategories(categoryId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  // Statistics routes
  app.get('/api/stats/player', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getPlayerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.get('/api/stats/team', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      
      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getTeamStats(user.teamId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ message: "Failed to fetch team stats" });
    }
  });

  // Analytics endpoint for real-time dashboard
  app.get('/api/analytics/team', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      
      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const analytics = await storage.getTeamAnalytics(user.teamId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching team analytics:", error);
      res.status(500).json({ message: "Failed to fetch team analytics" });
    }
  });

  // Manual payment recording endpoint
  app.post('/api/admin/fines/:fineId/record-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { fineId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);
      
      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { paymentMethod, paymentDate, transactionId, notes, amount } = req.body;

      // Validate required fields
      if (!paymentMethod || !amount) {
        return res.status(400).json({ message: "Payment method and amount are required" });
      }

      const fine = await storage.recordManualPayment(fineId, {
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionId,
        notes,
        amount: amount.toString(),
        recordedBy: userId,
      });

      // Get player and admin details for notifications
      const player = await storage.getUser(fine.playerId);
      const playerName = player ? `${player.firstName} ${player.lastName}` : 'Player';

      // Create notification for player
      await storage.createNotification({
        userId: fine.playerId,
        title: "Payment Recorded",
        message: `Your payment of £${amount} has been recorded`,
        type: "payment_confirmed",
        relatedEntityId: fine.id,
      });

      // Create notification for admin (fine_paid type for admin notifications)
      await storage.createNotification({
        userId: userId, // Admin who marked it as paid
        title: "Fine Marked as Paid",
        message: `Fine for ${playerName} (£${amount}) has been settled`,
        type: "fine_paid",
        relatedEntityId: fine.id,
      });

      // Create audit log
      await storage.createAuditLog({
        entityType: 'fine',
        entityId: fine.id,
        action: 'payment_recorded',
        userId,
        changes: { paymentMethod, amount, transactionId },
      });

      res.json({ message: "Payment recorded successfully", fine });
    } catch (error) {
      console.error("Error recording manual payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: "gbp", // UK currency
        payment_method_types: ['card', 'link'],
        // Enable additional payment methods that are available in UK
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never' // Keep users on our page
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId, fineIds } = req.body;
      const userId = req.user.claims.sub;

      // Mark fines as paid
      for (const fineId of fineIds) {
        await storage.updateFine(fineId, {
          isPaid: true,
          paidAt: new Date(),
          paymentIntentId,
        });

        // Create notification
        await storage.createNotification({
          userId,
          title: "Fine Paid",
          message: "Your fine payment has been processed successfully",
          type: "fine_paid",
          relatedEntityId: fineId,
        });

        // Create audit log
        await storage.createAuditLog({
          entityType: 'fine',
          entityId: fineId,
          action: 'pay',
          userId,
          changes: { isPaid: true, paymentIntentId },
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Profile routes
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, position, nickname } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        firstName,
        lastName,
        position,
        nickname,
      });

      await storage.createAuditLog({
        entityType: 'user',
        entityId: userId,
        action: 'update',
        userId,
        changes: { firstName, lastName, position, nickname },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin team share link
  app.get('/api/admin/share-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithTeam(userId);

      if (!user?.teamId || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const team = await storage.getTeam(user.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const shareUrl = `${req.protocol}://${req.hostname}/join/${team.inviteCode}`;
      
      res.json({ 
        shareUrl,
        inviteCode: team.inviteCode,
        teamName: team.name 
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      res.status(500).json({ message: "Failed to generate share link" });
    }
  });

  // Admin audit log
  app.get('/api/admin/audit-log', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const auditData = await storage.getAuditLog(user.teamId!, page, limit);
      res.json(auditData);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  // Migrate existing data to audit log (admin only)
  app.post('/api/admin/migrate-audit-log', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { migrateExistingFinesToAuditLog } = await import('./migrate-audit-log');
      await migrateExistingFinesToAuditLog();
      
      res.json({ success: true, message: "Audit log migration completed successfully" });
    } catch (error) {
      console.error("Error during audit log migration:", error);
      res.status(500).json({ message: "Failed to migrate audit log" });
    }
  });

  // Bulk issue fines endpoint
  app.post('/api/admin/bulk-issue-fines', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { playerIds, subcategoryId, description } = req.body;
      
      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        return res.status(400).json({ message: "At least one player must be selected" });
      }
      
      if (!subcategoryId) {
        return res.status(400).json({ message: "Subcategory is required" });
      }

      // Get subcategory details for the default amount
      const subcategory = await storage.getSubcategory(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      const results = await Promise.all(
        playerIds.map(async (playerId: string) => {
          try {
            return await storage.createFine({
              playerId,
              subcategoryId,
              amount: subcategory.defaultAmount,
              description: description || null,
              issuedBy: user.id,
            });
          } catch (error) {
            console.error(`Failed to create fine for player ${playerId}:`, error);
            return null;
          }
        })
      );

      const successfulFines = results.filter(Boolean);
      
      res.json({ 
        success: true, 
        count: successfulFines.length,
        message: `Successfully issued ${successfulFines.length} fines` 
      });
    } catch (error) {
      console.error("Error creating bulk fines:", error);
      res.status(500).json({ message: "Failed to create bulk fines" });
    }
  });

  // Bulk delete fines endpoint
  app.post('/api/admin/bulk-delete-fines', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fineIds } = req.body;
      
      if (!Array.isArray(fineIds) || fineIds.length === 0) {
        return res.status(400).json({ message: "At least one fine ID must be provided" });
      }

      const results = await Promise.all(
        fineIds.map(async (fineId: string) => {
          try {
            await storage.deleteFine(fineId);
            return fineId;
          } catch (error) {
            console.error(`Failed to delete fine ${fineId}:`, error);
            return null;
          }
        })
      );

      const successfulDeletes = results.filter(Boolean);
      
      res.json({ 
        success: true, 
        count: successfulDeletes.length,
        message: `Successfully deleted ${successfulDeletes.length} fines` 
      });
    } catch (error) {
      console.error("Error deleting bulk fines:", error);
      res.status(500).json({ message: "Failed to delete bulk fines" });
    }
  });

  // Admin routes
  app.get('/api/admin/unpaid-fines', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const unpaidFines = await storage.getUnpaidFines(user.teamId!);
      res.json(unpaidFines);
    } catch (error) {
      console.error("Error fetching unpaid fines:", error);
      res.status(500).json({ message: "Failed to fetch unpaid fines" });
    }
  });

  app.get('/api/admin/team-members', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const members = await storage.getTeamMembers(user.teamId!);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.delete('/api/admin/fines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      
      // Get fine details before deleting for notifications
      const fineDetails = await storage.getFineById(id);
      if (!fineDetails) {
        return res.status(404).json({ message: "Fine not found" });
      }

      const player = await storage.getUser(fineDetails.playerId);
      const playerName = player ? `${player.firstName} ${player.lastName}` : 'Player';
      const amount = fineDetails.amount;

      // Actually delete the fine from database
      await storage.deleteFine(id);
      
      // Create notification for player
      await storage.createNotification({
        userId: fineDetails.playerId,
        title: "Fine Removed",
        message: `A fine of £${amount} has been removed by an admin`,
        type: "fine_removed",
        relatedEntityId: id,
      });

      // Create notification for admin (fine_deleted type for admin notifications)
      await storage.createNotification({
        userId: user.id,
        title: "Fine Deleted",
        message: `Fine for ${playerName} (£${amount}) has been deleted`,
        type: "fine_deleted",
        relatedEntityId: id,
      });
      
      await storage.createAuditLog({
        entityType: 'fine',
        entityId: id,
        action: 'delete',
        userId: user.id,
        changes: { deleted: true, amount, playerId: fineDetails.playerId },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fine:", error);
      res.status(500).json({ message: "Failed to delete fine" });
    }
  });

  // Delete category route
  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteCategory(id);
      
      await storage.createAuditLog({
        entityType: 'category',
        entityId: id,
        action: 'delete',
        userId: user.id,
        changes: { deleted: true },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Delete subcategory route
  app.delete('/api/subcategories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteSubcategory(id);
      
      await storage.createAuditLog({
        entityType: 'subcategory',
        entityId: id,
        action: 'delete',
        userId: user.id,
        changes: { deleted: true },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ message: "Failed to delete subcategory" });
    }
  });

  // Admin preferences routes
  app.get('/api/admin/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const preferences = await storage.getAdminPreferences(user.id);
      // Return default preferences if none exist
      res.json(preferences || {
        userId: user.id,
        emailAlertsEnabled: false,
        pushNotificationsEnabled: false,
        summaryNotificationsEnabled: false
      });
    } catch (error) {
      console.error("Error fetching admin preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post('/api/admin/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { emailAlertsEnabled, pushNotificationsEnabled, summaryNotificationsEnabled } = req.body;
      const preferences = await storage.upsertAdminPreferences({
        userId: user.id,
        emailAlertsEnabled: emailAlertsEnabled ?? true,
        pushNotificationsEnabled: pushNotificationsEnabled ?? true,
        summaryNotificationsEnabled: summaryNotificationsEnabled ?? false,
      });

      res.json(preferences);
    } catch (error) {
      console.error("Error saving admin preferences:", error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  // Reorder categories route (must be before the general category update route)
  app.patch('/api/categories/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "Invalid category IDs array" });
      }

      await storage.reorderCategories(categoryIds);
      
      await storage.createAuditLog({
        entityType: 'category',
        entityId: 'bulk',
        action: 'reorder',
        userId: user.id,
        changes: { newOrder: categoryIds },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // Update category route
  app.patch('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const updatedCategory = await storage.updateCategory(id, { name, color });
      
      await storage.createAuditLog({
        entityType: 'category',
        entityId: id,
        action: 'update',
        userId: user.id,
        changes: { name, color },
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Reorder subcategories route (must be before the general subcategory update route)
  app.patch('/api/categories/:categoryId/subcategories/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { categoryId } = req.params;
      const { subcategoryIds } = req.body;
      
      if (!Array.isArray(subcategoryIds)) {
        return res.status(400).json({ message: "Invalid subcategory IDs array" });
      }

      await storage.reorderSubcategories(categoryId, subcategoryIds);
      
      await storage.createAuditLog({
        entityType: 'subcategory',
        entityId: 'bulk',
        action: 'reorder',
        userId: user.id,
        changes: { categoryId, newOrder: subcategoryIds },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering subcategories:", error);
      res.status(500).json({ message: "Failed to reorder subcategories" });
    }
  });

  // Update subcategory route
  app.patch('/api/subcategories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, defaultAmount, icon } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Subcategory name is required" });
      }

      const updatedSubcategory = await storage.updateSubcategory(id, { name, defaultAmount, icon });
      
      await storage.createAuditLog({
        entityType: 'subcategory',
        entityId: id,
        action: 'update',
        userId: user.id,
        changes: { name, defaultAmount, icon },
      });

      res.json(updatedSubcategory);
    } catch (error) {
      console.error("Error updating subcategory:", error);
      res.status(500).json({ message: "Failed to update subcategory" });
    }
  });

  // Add player route
  app.post('/api/admin/add-player', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { firstName, lastName, email, position, nickname } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      // Create new user with team assignment
      const newPlayer = await storage.upsertUser({
        id: email, // Use email as temporary ID
        firstName,
        lastName,
        email,
        position,
        nickname,
        teamId: user.teamId,
        role: 'player',
      });

      await storage.createAuditLog({
        entityType: 'user',
        entityId: newPlayer.id,
        action: 'create',
        userId: user.id,
        changes: { firstName, lastName, email, position, nickname, teamId: user.teamId },
      });

      res.json(newPlayer);
    } catch (error) {
      console.error("Error adding player:", error);
      res.status(500).json({ message: "Failed to add player" });
    }
  });

  // Team management routes
  app.patch('/api/team', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, sport } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Team name is required" });
      }

      const updatedTeam = await storage.updateTeam(user.teamId!, { name, sport });

      await storage.createAuditLog({
        entityType: 'team',
        entityId: updatedTeam.id,
        action: 'update',
        userId: user.id,
        changes: { name, sport },
      });

      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  // Player management routes
  // Update player profile (admin)
  app.patch('/api/admin/players/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { firstName, lastName, email, position, nickname, role } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      // Update player
      const updatedPlayer = await storage.upsertUser({
        id,
        firstName,
        lastName,
        email,
        position: position || null,
        nickname: nickname || null,
        role: role || 'player',
        updatedAt: new Date(),
      } as any);

      // Create audit log
      await storage.createAuditLog({
        entityType: 'user',
        entityId: id,
        action: 'profile_updated',
        userId: user.id,
        changes: { firstName, lastName, email, position, nickname, role },
      });

      res.json({ success: true, player: updatedPlayer });
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete('/api/admin/players/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      
      // Remove player from team
      await storage.upsertUser({
        id,
        teamId: null,
      } as any);

      await storage.createAuditLog({
        entityType: 'user',
        entityId: id,
        action: 'remove_from_team',
        userId: user.id,
        changes: { teamId: null },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing player:", error);
      res.status(500).json({ message: "Failed to remove player" });
    }
  });

  app.patch('/api/admin/players/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'player'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Player not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...targetUser,
        role,
      });

      await storage.createAuditLog({
        entityType: 'user',
        entityId: id,
        action: 'update_role',
        userId: user.id,
        changes: { role },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating player role:", error);
      res.status(500).json({ message: "Failed to update player role" });
    }
  });

  // Category management routes
  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const category = await storage.createFineCategory({
        teamId: user.teamId!,
        name,
        color: color || '#1E40AF',
        sortOrder: 0,
      });

      await storage.createAuditLog({
        entityType: 'category',
        entityId: category.id,
        action: 'create',
        userId: user.id,
        changes: { name, color },
      });

      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.post('/api/categories/:id/subcategories', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { name, defaultAmount, icon } = req.body;
      
      if (!name || !defaultAmount) {
        return res.status(400).json({ message: "Subcategory name and default amount are required" });
      }

      const subcategory = await storage.createFineSubcategory({
        categoryId: id,
        name,
        defaultAmount,
        icon: icon || 'fas fa-gavel',
        sortOrder: 0,
      });

      await storage.createAuditLog({
        entityType: 'subcategory',
        entityId: subcategory.id,
        action: 'create',
        userId: user.id,
        changes: { categoryId: id, name, defaultAmount, icon },
      });

      res.json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      res.status(500).json({ message: "Failed to create subcategory" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Get notification counts by view (player vs admin)
  app.get('/api/notifications/counts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      
      // Player notifications: fine_issued, reminder, team_update, fine_removed, etc.
      const playerNotifications = notifications.filter(n => 
        n.type === 'fine_issued' || n.type === 'reminder' || n.type === 'team_update' || n.type === 'fine_removed' || n.type === 'payment_confirmed'
      );
      
      // Admin notifications: fine_paid, fine_deleted (settled fines)
      const adminNotifications = notifications.filter(n => 
        n.type === 'fine_paid' || n.type === 'fine_deleted'
      );
      
      res.json({
        player: {
          total: playerNotifications.length,
          unread: playerNotifications.filter(n => !n.isRead).length
        },
        admin: {
          total: adminNotifications.length,
          unread: adminNotifications.filter(n => !n.isRead).length
        }
      });
    } catch (error) {
      console.error("Error fetching notification counts:", error);
      res.status(500).json({ message: "Failed to fetch notification counts" });
    }
  });

  // Profile image upload endpoint for admins
  app.post('/api/admin/upload-profile-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      console.log("Upload request received:", req.body, req.file);
      
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        console.log("Access denied for user:", user?.role);
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        console.log("No file in request");
        return res.status(400).json({ message: "No image file provided" });
      }

      const playerId = req.body.playerId;
      if (!playerId) {
        console.log("No player ID provided");
        return res.status(400).json({ message: "Player ID is required" });
      }

      // Check if the file is a valid image
      console.log("File details:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      const imageUrl = `/uploads/${req.file.filename}`;

      // Update player profile with new image URL
      const updatedUser = await storage.upsertUser({
        id: playerId,
        profileImageUrl: imageUrl,
        updatedAt: new Date(),
      } as any);

      console.log("User updated with image URL:", imageUrl);

      // Create audit log
      await storage.createAuditLog({
        entityType: 'user',
        entityId: playerId,
        action: 'profile_image_updated',
        userId: user.id,
        changes: { profileImageUrl: imageUrl },
      });

      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ 
        message: "Failed to upload profile image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Profile image upload endpoint for regular users
  app.post('/api/upload-profile-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      console.log("User upload request received:", req.body, req.file);
      
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        console.log("No file in request");
        return res.status(400).json({ message: "No image file provided" });
      }

      const playerId = req.body.playerId;
      if (!playerId || playerId !== user.id) {
        console.log("Invalid player ID or unauthorized");
        return res.status(403).json({ message: "Can only update your own profile" });
      }

      // Check if the file is a valid image
      console.log("File details:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      const imageUrl = `/uploads/${req.file.filename}`;

      // Update user profile with new image URL
      const updatedUser = await storage.upsertUser({
        id: playerId,
        profileImageUrl: imageUrl,
        updatedAt: new Date(),
      } as any);

      console.log("User updated with image URL:", imageUrl);

      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ 
        message: "Failed to upload profile image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Mount payment system routes
  try {
    const paymentRoutes = await import('./paymentRoutes');
    app.use('/api', paymentRoutes.default);
    console.log('✅ Payment routes mounted successfully');
  } catch (error) {
    console.warn('⚠️ Payment routes not available:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Mount subscription management routes
  try {
    const subscriptionRoutes = await import('./subscriptionRoutes');
    app.use('/api/subscriptions', subscriptionRoutes.default);
    console.log('✅ Subscription routes mounted successfully');
  } catch (error) {
    console.warn('⚠️ Subscription routes not available:', error instanceof Error ? error.message : 'Unknown error');
  }

  const httpServer = createServer(app);
  return httpServer;
}
