import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";

export default function Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [email, setEmail] = useState("xyeoda@yeoda.space");
  const [householdName, setHouseholdName] = useState("My Family");
  const [defaultPassword, setDefaultPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleResetDatabase = async () => {
    setResetting(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.functions.invoke("reset-database", {
        body: { resetToken: "RESET_ALL_DATA_NOW" },
      });

      if (error) throw error;

      toast({
        title: "Database Reset Complete!",
        description: "You can now create a fresh admin account.",
      });
      setErrorMessage("");
    } catch (error: any) {
      console.error("Error resetting database:", error);
      toast({
        title: "Failed to Reset Database",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

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
          householdName,
        },
      });

      if (error) {
        // Check if it's the "admin already exists" error
        if (error.message?.includes("Admin already exists") || error.message?.includes("already exists")) {
          setErrorMessage("An administrator account already exists. Please reset the database from the Dashboard first, or sign in if you already have an account.");
          return;
        }
        throw error;
      }

      toast({
        title: "Admin Created!",
        description: `Admin account created for ${email}. You can now sign in.`,
      });

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setErrorMessage(error.message || "Failed to create admin account. Please try again.");
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
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md border border-border/50">
              <p className="text-xs text-muted-foreground">
                ℹ️ This account will have full administrative privileges and can invite other users.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-md">
                <p className="text-sm text-destructive font-medium mb-3">{errorMessage}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleResetDatabase}
                    disabled={resetting}
                    className="flex-1"
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset & Start Fresh"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}

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
              <Label htmlFor="household-name">Household Name</Label>
              <Input
                id="household-name"
                type="text"
                placeholder="The Smith Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                This will be the name of your family calendar
              </p>
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

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

            {/* Always-visible reset section */}
            <div className="pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Need to clear everything?</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/reset")}
                  className="text-xs"
                >
                  Go to Reset Database
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
