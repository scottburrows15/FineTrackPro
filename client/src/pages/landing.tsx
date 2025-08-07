import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gavel, 
  Users, 
  CreditCard, 
  Shield, 
  TrendingUp, 
  Bell,
  CheckCircle,
  Star
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">TeamFines Pro</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
          🇬🇧 Built for UK Sports Teams
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
          Professional Fine Management
          <span className="block text-primary">for Sports Teams</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Streamline your team's fine system with automated payments, real-time notifications, 
          and comprehensive admin controls. Say goodbye to spreadsheets and chasing payments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-blue-700 text-lg px-8 py-4"
          >
            Get Started Free
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-4 border-2"
          >
            Watch Demo
          </Button>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">£2.3M+</div>
            <div className="text-sm text-slate-600">Fines Processed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success">500+</div>
            <div className="text-sm text-slate-600">Teams Using</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning">99.9%</div>
            <div className="text-sm text-slate-600">Payment Success</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need to Manage Team Fines
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Purpose-built for UK sports teams with all the features you need and none you don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Instant Payments</CardTitle>
              <CardDescription>
                Secure Stripe integration for instant fine payments. Players can settle up with a single click.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Card and PayPal support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Automatic payment tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Receipt generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Granular permissions ensure the right people have the right access to team data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Admin and player roles
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Secure invite links
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Activity audit trail
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-warning" />
              </div>
              <CardTitle>Smart Notifications</CardTitle>
              <CardDescription>
                Keep everyone informed with automatic notifications for fines, payments, and reminders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Email notifications
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  In-app alerts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Payment reminders
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center mb-4">
                <Gavel className="w-6 h-6 text-danger" />
              </div>
              <CardTitle>Flexible Fine System</CardTitle>
              <CardDescription>
                Create custom categories and subcategories with automatic icon suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Custom categories
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Automatic icon matching
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Bulk operations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Comprehensive insights into team performance and fine patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Team leaderboards
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Export to CSV
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Monthly reports
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Easy player onboarding with invite links and QR codes for seamless team setup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Invite link generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Player profiles
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-success mr-2" />
                  Position tracking
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Modernise Your Team's Fine System?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of UK sports teams already using TeamFines Pro to streamline their operations.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-4"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">TeamFines Pro</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2024 TeamFines Pro. Built for UK sports teams.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
