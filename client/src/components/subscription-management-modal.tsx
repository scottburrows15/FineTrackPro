import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Check, Crown, Zap, Star, Building2 } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  maxTeamMembers: number | null;
  maxCategories: number | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

interface CurrentSubscription {
  subscription: {
    id: string;
    planId: string;
    status: string;
    billingInterval: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: SubscriptionPlan;
  isFreeTier: boolean;
  teamMemberCount: number;
  categoryCount: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const featureLabels = {
  basic_fine_management: "Basic Fine Management",
  online_payments: "Online Payments (Stripe)",
  basic_notifications: "Basic Notifications",
  simple_dashboard: "Simple Dashboard",
  unlimited_categories: "Unlimited Categories",
  bulk_operations: "Bulk Operations",
  enhanced_analytics: "Enhanced Analytics",
  email_notifications: "Email Notifications",
  open_banking_payments: "Open Banking Payments",
  mobile_responsive: "Mobile Responsive",
  unlimited_team_size: "Unlimited Team Size",
  audit_trail: "Comprehensive Audit Trail",
  data_export: "Data Export",
  priority_support: "Priority Support",
  custom_branding: "Custom Branding",
  advanced_reporting: "Advanced Reporting",
  trend_analysis: "Trend Analysis",
  api_access: "API Access",
  custom_integrations: "Custom Integrations",
  white_label: "White Label Branding",
  dedicated_support: "Dedicated Support",
  sso: "Single Sign-On",
  custom_reports: "Custom Reports",
  multi_team_management: "Multi-Team Management"
};

const planIcons = {
  starter: Crown,
  club: Zap,
  pro: Star,
  enterprise: Building2
};

const planColors = {
  starter: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
  club: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  pro: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
  enterprise: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
};

export default function SubscriptionManagementModal({ isOpen, onClose }: Props) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  // Fetch available subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
    enabled: isOpen,
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: currentLoading } = useQuery<CurrentSubscription>({
    queryKey: ["/api/subscriptions/current"],
    enabled: isOpen,
  });

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (data: { planId: string; billingInterval: string }) => {
      return apiRequest("POST", "/api/subscriptions/create", data);
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    createSubscription.mutate({
      planId,
      billingInterval
    });
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingInterval === "yearly" && plan.yearlyPrice 
      ? parseFloat(plan.yearlyPrice) 
      : parseFloat(plan.monthlyPrice);
    
    if (price === 0) {
      return plan.name === "enterprise" ? "Custom" : "Free";
    }

    if (billingInterval === "yearly" && plan.yearlyPrice) {
      const monthlyEquivalent = price / 12;
      return `£${monthlyEquivalent.toFixed(0)}/mo (billed yearly)`;
    }

    return `£${price}/mo`;
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan?.id === planId;
  };

  const isUpgrade = (plan: SubscriptionPlan) => {
    if (!currentSubscription?.plan) return true;
    return plan.sortOrder > currentSubscription.plan.sortOrder;
  };

  if (plansLoading || currentLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="subscription-modal">
          <DialogHeader>
            <DialogTitle>Subscription Management</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="subscription-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Subscription Management</DialogTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-muted-foreground">
              Choose the perfect plan for your rugby club
            </p>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={billingInterval === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingInterval("monthly")}
                data-testid="billing-monthly"
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingInterval("yearly")}
                data-testid="billing-yearly"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 17%
                </Badge>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {currentSubscription && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Current Plan: {currentSubscription.plan.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Team Members</p>
                  <p className="font-medium">
                    {currentSubscription.teamMemberCount}
                    {currentSubscription.plan.maxTeamMembers 
                      ? ` / ${currentSubscription.plan.maxTeamMembers}` 
                      : " / Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categories</p>
                  <p className="font-medium">
                    {currentSubscription.categoryCount}
                    {currentSubscription.plan.maxCategories 
                      ? ` / ${currentSubscription.plan.maxCategories}` 
                      : " / Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={currentSubscription.subscription?.status === "active" ? "default" : "secondary"}>
                    {currentSubscription.subscription?.status || "Free Tier"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Billing</p>
                  <p className="font-medium">
                    {currentSubscription.subscription?.billingInterval || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans?.map((plan) => {
            const Icon = planIcons[plan.name as keyof typeof planIcons];
            const price = formatPrice(plan);
            const isCurrent = isCurrentPlan(plan.id);
            const isUpgradeOption = isUpgrade(plan);

            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isCurrent 
                    ? "ring-2 ring-primary shadow-lg" 
                    : planColors[plan.name as keyof typeof planColors] || ""
                }`}
                data-testid={`plan-card-${plan.name}`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Current Plan
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {Icon && <Icon className="w-6 h-6" />}
                    <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {price}
                  </div>
                  <CardDescription className="text-sm min-h-[3rem] flex items-center">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 6).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{featureLabels[feature as keyof typeof featureLabels] || feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-xs text-muted-foreground">
                        +{plan.features.length - 6} more features
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    variant={isCurrent ? "outline" : "default"}
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={createSubscription.isPending || isCurrent}
                    data-testid={`select-plan-${plan.name}`}
                  >
                    {createSubscription.isPending 
                      ? "Processing..." 
                      : isCurrent 
                        ? "Current Plan" 
                        : isUpgradeOption 
                          ? "Upgrade" 
                          : "Downgrade"
                    }
                  </Button>

                  {plan.name === "enterprise" && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Contact us for custom pricing
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Need help choosing?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Starter:</strong> Perfect for small clubs with basic needs</li>
            <li>• <strong>Club:</strong> Ideal for established clubs with regular activities</li>
            <li>• <strong>Pro:</strong> Best for competitive clubs needing advanced features</li>
            <li>• <strong>Enterprise:</strong> Custom solution for professional organizations</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}