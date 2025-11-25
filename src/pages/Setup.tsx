import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, CheckCircle2 } from "lucide-react";

export default function Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState("xyeoda@yeoda.space");
  const [defaultPassword, setDefaultPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const checkExistingAdmin = async () => {
    setChecking(true);
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      setAdminExists(users?.users && users.users.length > 0);
    } catch (error) {
      console.error("Error checking for admin:", error);
      setAdminExists(null);
    } finally {
      setChecking(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (defaultPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (defaultPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error, data } = await supabase.functions.invoke("create-admin", {
        body: {
          email,
          defaultPassword,
        },
      });

      if (error) throw error;

      toast({
        title: "Admin Created!",
        description: `Admin account created for ${email}. You can now sign in.`,
      });

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Failed to Create Admin",
        description: error.message || "Please try again",
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
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Initial Setup</CardTitle>
          </div>
          <CardDescription>
            Create the master administrator account for YeoDa Family Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminExists === null ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Before setting up a new admin account, we need to check if one already exists.
              </p>
              <Button onClick={checkExistingAdmin} disabled={checking} className="w-full">
                {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check System Status
              </Button>
            </div>
          ) : adminExists ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">Admin Already Exists</h3>
              <p className="text-sm text-muted-foreground">
                An administrator account has already been created. Please sign in to continue.
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md border border-border/50">
                <p className="text-xs text-muted-foreground">
                  ℹ️ This account will have full administrative privileges and can invite other users.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-password">Initial Password</Label>
                <Input
                  id="default-password"
                  type="password"
                  placeholder="••••••••"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  You will be required to change this password on first login
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
