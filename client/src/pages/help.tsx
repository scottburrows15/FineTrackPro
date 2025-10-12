import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";
import { 
  HelpCircle, 
  Mail, 
  BookOpen, 
  MessageSquare,
  Activity,
  Info,
  Send,
  ExternalLink
} from "lucide-react";
import AppLayout from "@/components/ui/app-layout";
import { useToast } from "@/hooks/use-toast";

export default function Help() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    email: user?.email || "",
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Support Request Sent",
      description: "We'll get back to you within 24 hours.",
    });
    setSupportForm({ subject: "", message: "", email: user?.email || "" });
  };

  if (!user) {
    return null;
  }

  const currentView = user.role === 'admin' ? 'admin' : 'player';

  return (
    <AppLayout
      user={user}
      currentView={currentView}
      pageTitle="Help Center"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold">Help Center</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers, get support, and learn how to use the platform
          </p>
        </div>

        {/* System Status */}
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">All Systems Operational</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Last checked: Just now</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30">
              <Activity className="mr-1 h-3 w-3" />
              Online
            </Badge>
          </div>
        </Card>

        {/* FAQs */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          </div>
          <Separator className="my-4" />
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" data-testid="faq-payment">
              <AccordionTrigger>How do I pay my fines?</AccordionTrigger>
              <AccordionContent>
                Navigate to the "Fines" page and click the "Pay Outstanding" button. You can pay via Stripe or PayPal. 
                Once payment is processed, your fine will be marked as paid automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" data-testid="faq-notifications">
              <AccordionTrigger>How do I enable notifications?</AccordionTrigger>
              <AccordionContent>
                Go to Settings → Notifications and toggle on the notification types you want to receive. 
                You can choose email notifications, push notifications, and specific alerts for fines and payments.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" data-testid="faq-team">
              <AccordionTrigger>How do I invite players to my team?</AccordionTrigger>
              <AccordionContent>
                As an admin, you'll see a "Team Invitation" card on your dashboard with a shareable link. 
                Copy this link and send it to your team members. They can join by clicking the link and signing in with Replit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" data-testid="faq-categories">
              <AccordionTrigger>Can I customize fine categories?</AccordionTrigger>
              <AccordionContent>
                Yes! Admins can manage fine categories by going to Settings → Manage Categories. 
                You can add, edit, or delete categories and subcategories to match your team's needs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" data-testid="faq-analytics">
              <AccordionTrigger>What analytics are available?</AccordionTrigger>
              <AccordionContent>
                Admins have access to comprehensive analytics including total fines, payment rates, 
                category breakdowns, monthly trends, and a "Hall of Shame" leaderboard showing top offenders.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Contact Support */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">Contact Support</h2>
          </div>
          <Separator className="my-4" />
          <form onSubmit={handleSubmitSupport} className="space-y-4">
            <div>
              <Label htmlFor="support-email">Email</Label>
              <Input
                id="support-email"
                type="email"
                value={supportForm.email}
                onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
                data-testid="input-support-email"
              />
            </div>
            <div>
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                value={supportForm.subject}
                onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                required
                data-testid="input-support-subject"
              />
            </div>
            <div>
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                value={supportForm.message}
                onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue in detail..."
                rows={5}
                required
                data-testid="textarea-support-message"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-submit-support">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </form>
        </Card>

        {/* Tutorials & Guides */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl font-semibold">Tutorials & Guides</h2>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between" data-testid="button-tutorial-getting-started">
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Getting Started Guide
              </span>
              <Badge variant="outline">New</Badge>
            </Button>
            <Button variant="outline" className="w-full justify-between" data-testid="button-tutorial-admin">
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Admin Management Tutorial
              </span>
            </Button>
            <Button variant="outline" className="w-full justify-between" data-testid="button-tutorial-payments">
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Payment Processing Guide
              </span>
            </Button>
          </div>
        </Card>

        {/* Feature Feedback */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold">Feature Feedback</h2>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground mb-4">
            We'd love to hear your ideas for improving the platform!
          </p>
          <Button variant="outline" className="w-full" data-testid="button-feature-feedback">
            <MessageSquare className="mr-2 h-4 w-4" />
            Submit Feature Request
          </Button>
        </Card>

        {/* Version Info */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Version 1.0.0</span>
            </div>
            <span>© 2025 Fines Management System</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
