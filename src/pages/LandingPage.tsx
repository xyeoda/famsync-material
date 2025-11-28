import { useNavigate } from "react-router-dom";
import { Calendar, Users, Car, Repeat, Shield, Smartphone, ArrowRight, LogIn, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminBootstrap } from "@/components/AdminBootstrap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [hasHousehold, setHasHousehold] = useState<boolean | null>(null);
  
  const featuresHeaderRef = useScrollAnimation();
  const howItWorksRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

  // Check if logged-in user has a household and redirect if they do
  useEffect(() => {
    const checkHousehold = async () => {
      if (!user) {
        setHasHousehold(null);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data?.household_id) {
        // User has a household - redirect them there
        navigate(`/family/${data.household_id}`);
      } else {
        setHasHousehold(false);
      }
    };

    checkHousehold();
  }, [user, navigate]);

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

  const featureRefs = features.map(() => useScrollAnimation());
  const stepRefs = [useScrollAnimation(), useScrollAnimation(), useScrollAnimation()];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-40 left-20 w-48 h-48 bg-gradient-to-br from-tertiary/15 to-primary/15 rounded-full blur-3xl animate-float-medium" />
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl animate-pulse-soft" />
      </div>

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
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
                  <Button
                    variant="outlined"
                    onClick={signOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4 relative z-10">
          {/* Warning for users without household */}
          {user && hasHousehold === false && (
            <Alert className="max-w-3xl mx-auto mb-8 border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account is not assigned to a household. Please contact your administrator or sign out and use a valid invitation link to complete setup.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Hero Text */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Family Scheduling,<br />
                <span className="text-primary">Simplified.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                The multi-family calendar that keeps everyone organized. Each family, their own space.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
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

            {/* Hero Visual - Calendar Mockup */}
            <div className="relative animate-fade-in-up [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
              <div className="relative mx-auto max-w-md">
                {/* Decorative blur orbs behind mockup */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse-soft" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl animate-pulse-soft [animation-delay:1s]" />
                
                {/* Calendar Mockup */}
                <div className="relative bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-elevation-3 p-6 space-y-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/30">
                    <h3 className="text-lg font-semibold text-foreground">December 2024</h3>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">&lt;</div>
                      <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">&gt;</div>
                    </div>
                  </div>

                  {/* Mini Week View */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground text-center mb-2">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                    </div>
                    
                    {/* Event blocks */}
                    <div className="grid grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <div className="h-12 rounded-md bg-category-sports/20 border-l-2 border-category-sports flex items-center justify-center text-xs text-foreground/80">Soccer</div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-12 rounded-md bg-category-education/20 border-l-2 border-category-education flex items-center justify-center text-xs text-foreground/80">School</div>
                        <div className="h-8 rounded-md bg-category-sports/20 border-l-2 border-category-sports"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-8 rounded-md bg-category-social/20 border-l-2 border-category-social"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-8 rounded-md bg-category-social/20 border-l-2 border-category-social"></div>
                        <div className="h-12 rounded-md bg-category-sports/20 border-l-2 border-category-sports flex items-center justify-center text-xs text-foreground/80">Practice</div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-12 rounded-md bg-category-education/20 border-l-2 border-category-education flex items-center justify-center text-xs text-foreground/80">Piano</div>
                      </div>
                    </div>
                  </div>

                  {/* Family Avatars */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                    <div className="w-8 h-8 rounded-full bg-family-parent1 flex items-center justify-center text-xs text-white font-medium">P1</div>
                    <div className="w-8 h-8 rounded-full bg-family-parent2 flex items-center justify-center text-xs text-white font-medium">P2</div>
                    <div className="w-8 h-8 rounded-full bg-kid-kid1 flex items-center justify-center text-xs text-white font-medium">K1</div>
                    <div className="w-8 h-8 rounded-full bg-kid-kid2 flex items-center justify-center text-xs text-white font-medium">K2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30 relative">
        {/* Decorative orb */}
        <div className="absolute left-10 top-1/2 w-72 h-72 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-float-slow" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div 
              ref={featuresHeaderRef.ref}
              className={`text-center mb-16 animate-on-scroll ${featuresHeaderRef.isVisible ? 'visible' : ''}`}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything your family needs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to make family coordination effortless
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  ref={featureRefs[index].ref}
                  className={`animate-on-scroll ${featureRefs[index].isVisible ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <Card className="bg-card/80 backdrop-blur-md border-border/50 hover:shadow-elevation-2 transition-all h-full">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        {/* Decorative orbs */}
        <div className="absolute right-20 top-20 w-56 h-56 bg-gradient-to-br from-secondary/15 to-tertiary/15 rounded-full blur-3xl animate-float-medium" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div 
              ref={howItWorksRef.ref}
              className={`text-center mb-16 animate-on-scroll ${howItWorksRef.isVisible ? 'visible' : ''}`}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get started in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: 1, title: "Get Invited", desc: "Receive your family invitation via email from your administrator" },
                { num: 2, title: "Set Up Account", desc: "Create your secure password and access your family's calendar" },
                { num: 3, title: "Start Organizing", desc: "Add events, coordinate schedules, and keep everyone in sync" },
              ].map((step, index) => (
                <div
                  key={step.num}
                  ref={stepRefs[index].ref}
                  className={`text-center space-y-4 ${index % 2 === 0 ? 'animate-on-scroll-left' : 'animate-on-scroll-right'} ${stepRefs[index].isVisible ? 'visible' : ''}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 relative">
        {/* Decorative background blob */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 rounded-full blur-3xl animate-pulse-soft" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div 
            ref={ctaRef.ref}
            className={`max-w-3xl mx-auto text-center space-y-8 animate-on-scroll ${ctaRef.isVisible ? 'visible' : ''}`}
          >
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
      <footer className="border-t py-8 bg-card/30 relative z-10">
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
