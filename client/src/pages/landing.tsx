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
import logoUrl from "@assets/Foul-Pay-Logo_1762790615614_1762856044224.png";

export default function Landing() {
  return (
    <div className="min-h-screen gradient-hero animate-fade-in">
      {/* Enhanced Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={logoUrl} 
                alt="FoulPay Logo" 
                className="h-8 w-auto sm:h-10 object-contain"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/login'}
                className="btn-enhanced"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center animate-slide-up">
        <Badge variant="secondary" className="mb-8 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          🇬🇧 Built for UK Sports Teams
        </Badge>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
          Professional Fine Management
          <span className="block bg-gradient-primary bg-clip-text text-transparent">for Sports Teams</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
          Transform your team's fine system with automated payments, real-time notifications, 
          and comprehensive admin controls. Say goodbye to spreadsheets and chasing payments forever.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="btn-enhanced bg-primary hover:bg-primary/90 text-white text-lg px-10 py-4 rounded-xl shadow-elegant"
          >
            Get Started Free
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="btn-enhanced text-lg px-10 py-4 rounded-xl border-2 border-border hover:bg-muted"
          >
            Watch Demo
          </Button>
        </div>

        {/* Enhanced Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center glass-card rounded-2xl p-6 animate-scale-in">
            <div className="text-4xl font-bold text-primary mb-2">£2.3M+</div>
            <div className="text-sm text-muted-foreground font-medium">Fines Processed</div>
            <div className="status-online mx-auto mt-3"></div>
          </div>
          <div className="text-center glass-card rounded-2xl p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl font-bold text-success mb-2">500+</div>
            <div className="text-sm text-muted-foreground font-medium">Teams Using</div>
            <div className="status-online mx-auto mt-3"></div>
          </div>
          <div className="text-center glass-card rounded-2xl p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl font-bold text-warning mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground font-medium">Payment Success</div>
            <div className="status-online mx-auto mt-3"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-20 animate-fade-in">
          <Badge variant="outline" className="mb-4 px-4 py-2 text-primary border-primary/20">
            Complete Feature Set
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Everything You Need to Manage Team Fines
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Purpose-built for UK sports teams with all the features you need and none you don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="card-enhanced group hover:border-primary/30 transition-all duration-300 h-full">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl mb-3">Instant Payments</CardTitle>
              <CardDescription className="text-base leading-relaxed">
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
            Join hundreds of UK sports teams already using FoulPay to streamline their operations.
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
              <img 
                src={logoUrl} 
                alt="FoulPay Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 FoulPay. Built for UK sports teams.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
