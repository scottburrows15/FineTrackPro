import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { 
  subscriptionPlans,
  subscriptions,
  teams,
  users,
  InsertSubscription
} from '../shared/schema';
import { db } from './db';
import { isAuthenticated } from './replitAuth';

const router = Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
});

const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  billingInterval: z.enum(['monthly', 'yearly']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

// GET /api/subscriptions/plans - Get all available subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// GET /api/subscriptions/current - Get team's current subscription
router.get('/current', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's team
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team) {
      return res.status(400).json({ error: 'User must belong to a team' });
    }

    // Get current subscription with plan details
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.teamId, user.team.id),
        eq(subscriptions.status, 'active')
      ),
      with: {
        plan: true
      }
    });

    if (!subscription) {
      // Team doesn't have an active subscription, return starter plan
      const starterPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.name, 'starter')
      });

      return res.json({
        subscription: null,
        plan: starterPlan,
        isFreeTier: true,
        teamMemberCount: await getUserTeamMemberCount(user.team.id),
        categoryCount: await getTeamCategoryCount(user.team.id)
      });
    }

    res.json({
      subscription,
      plan: subscription.plan,
      isFreeTier: false,
      teamMemberCount: await getUserTeamMemberCount(user.team.id),
      categoryCount: await getTeamCategoryCount(user.team.id)
    });

  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST /api/subscriptions/create - Create new subscription for team
router.post('/create', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = createSubscriptionSchema.parse(req.body);
    const { planId, billingInterval } = validatedData;

    // Get user's team and check admin permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify the plan exists
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Check if team already has an active subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.teamId, user.team.id),
        eq(subscriptions.status, 'active')
      )
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'Team already has an active subscription' });
    }

    // For free starter plan, create subscription directly
    if (plan.name === 'starter') {
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          teamId: user.team.id,
          planId: plan.id,
          status: 'active',
          billingInterval,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        })
        .returning();

      return res.json({
        subscription: newSubscription,
        message: 'Free starter subscription activated'
      });
    }

    // For paid plans, integrate with Stripe (placeholder for now)
    // TODO: Implement Stripe subscription creation
    return res.status(501).json({ 
      error: 'Paid subscription creation not yet implemented',
      message: 'Stripe integration coming soon'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// PUT /api/subscriptions/update - Update current subscription
router.put('/update', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedData = updateSubscriptionSchema.parse(req.body);

    // Get user's team and check admin permissions
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { team: true }
    });

    if (!user?.team || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get current subscription
    const currentSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.teamId, user.team.id),
        eq(subscriptions.status, 'active')
      )
    });

    if (!currentSubscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Update subscription
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, currentSubscription.id))
      .returning();

    res.json(updatedSubscription);

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Helper functions
async function getUserTeamMemberCount(teamId: string): Promise<number> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.teamId, teamId));
  
  return result.length;
}

async function getTeamCategoryCount(teamId: string): Promise<number> {
  const { fineCategories } = await import('../shared/schema');
  const result = await db
    .select()
    .from(fineCategories)
    .where(eq(fineCategories.teamId, teamId));
  
  return result.length;
}

export default router;