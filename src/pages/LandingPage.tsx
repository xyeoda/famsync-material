import { useNavigate } from "react-router-dom";
import { Calendar, Users, Car, Repeat, Shield, Smartphone, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminBootstrap } from "@/components/AdminBootstrap";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Shared Family Calendar",
      description: "Everyone sees the same schedule in real-time. No more missed events or double bookings.",
    },
    {
      icon: Users,
      title: "Multi-Family Support",
      description: "Each family gets their own private, secure space. Perfect for organizations managing multiple households.",
    },
    {
      icon: Car,
      title: "Transportation Tracking",
      description: "Always know who's doing drop-off and pickup. Coordinate rides effortlessly.",
    },
    {
      icon: Repeat,
      title: "Recurring Events",
      description: "Set it once, see it everywhere. Perfect for weekly activities and regular commitments.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Parents edit, helpers and kids view. Secure permissions keep your schedule safe.",
    },
    {
      icon: Smartphone,
      title: "Works Everywhere",
      description: "Responsive design for phones, tablets, and dedicated display screens.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">YeoDa Calendar</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outlined"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Family Scheduling,<br />
              <span className="text-primary">Simplified.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The multi-family calendar that keeps everyone organized. Each family, their own space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                variant="filled"
                onClick={() => navigate("/auth")}
                className="gap-2 text-lg px-8"
              >
                Sign In
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Invite-only platform • Secure family spaces
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything your family needs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to make family coordination effortless
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/80 backdrop-blur-md border-border/50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get started in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground">Get Invited</h3>
                <p className="text-muted-foreground">
                  Receive your family invitation via email from your administrator
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground">Set Up Account</h3>
                <p className="text-muted-foreground">
                  Create your secure password and access your family's calendar
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground">Start Organizing</h3>
                <p className="text-muted-foreground">
                  Add events, coordinate schedules, and keep everyone in sync
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to get organized?
            </h2>
            <p className="text-xl text-muted-foreground">
              Sign in to access your family calendar
            </p>
            <Button
              size="lg"
              variant="filled"
              onClick={() => navigate("/auth")}
              className="gap-2 text-lg px-8"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 YeoDa Calendar. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Bootstrap - only shows if no admin exists */}
      <AdminBootstrap />
    </div>
  );
};

export default LandingPage;
