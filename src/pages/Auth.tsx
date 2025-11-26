import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in and if they need to change password
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if user is site admin
        const { data: systemRole } = await supabase
          .from("system_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "site_admin")
          .maybeSingle();

        if (systemRole) {
          navigate("/admin");
          return;
        }

        // Check if regular user needs to change password
        const { data: profile } = await supabase
          .from("profiles")
          .select("must_change_password")
          .eq("id", session.user.id)
          .single();

        if (profile?.must_change_password) {
          navigate("/change-password");
        } else {
          navigate("/calendar");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") {
        setTimeout(async () => {
          // Check if user is site admin
          const { data: systemRole } = await supabase
            .from("system_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "site_admin")
            .maybeSingle();

          if (systemRole) {
            navigate("/admin");
            return;
          }

          // Check if regular user needs to change password
          const { data: profile } = await supabase
            .from("profiles")
            .select("must_change_password")
            .eq("id", session.user.id)
            .single();

          if (profile?.must_change_password) {
            navigate("/change-password");
          } else {
            navigate("/calendar");
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/calendar`
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Account created. You can now log in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Logged in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-15"
        style={{ backgroundImage: `url('/src/assets/dashboard-bg.png')` }}
      />
      <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-md border-border/50 relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl">YeoDa Family Calendar</CardTitle>
          <CardDescription>Sign in or create an account to manage your family calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot your password?
                  </Link>
                </div>
              </form>
              
              {/* UAT Reset Link */}
              <div className="text-center mt-4 pt-4 border-t border-border/50">
                <Link to="/reset" className="text-xs text-muted-foreground hover:text-primary">
                  Need to reset the database for testing?
                </Link>
              </div>
        </CardContent>
      </Card>
    </div>
  );
}
