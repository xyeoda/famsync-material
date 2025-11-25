import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Database, Users, Home, Settings, Calendar } from "lucide-react";

export default function Reset() {
  const [showDialog, setShowDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkDatabaseState = async () => {
    setLoading(true);
    try {
      const [households, profiles, userRoles, events, instances, settings] = await Promise.all([
        supabase.from("households").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
        supabase.from("family_events").select("id", { count: "exact", head: true }),
        supabase.from("event_instances").select("id", { count: "exact", head: true }),
        supabase.from("family_settings").select("id", { count: "exact", head: true }),
      ]);

      setDbStats({
        households: households.count || 0,
        profiles: profiles.count || 0,
        userRoles: userRoles.count || 0,
        events: events.count || 0,
        instances: instances.count || 0,
        settings: settings.count || 0,
      });
    } catch (error) {
      console.error("Error checking database state:", error);
      toast.error("Failed to check database state");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setShowDialog(false);

    try {
      console.log("Starting database reset...");
      
      const { data, error } = await supabase.functions.invoke("reset-database", {
        body: { resetToken: "RESET_ALL_DATA_NOW" },
      });

      if (error) {
        console.error("Reset error:", error);
        toast.error("Failed to reset database: " + error.message);
        setResetting(false);
        return;
      }

      console.log("Reset successful:", data);
      toast.success("Database reset complete!");

      // Clear all local storage
      localStorage.clear();

      // Sign out current user if any
      await supabase.auth.signOut();

      // Small delay to ensure everything is cleared
      setTimeout(() => {
        // Navigate to home and force reload
        window.location.href = "/";
      }, 1000);
    } catch (error: any) {
      console.error("Reset failed:", error);
      toast.error("Reset failed: " + error.message);
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Database className="h-8 w-8 text-destructive" />
            Database Reset Tool
          </CardTitle>
          <CardDescription>
            Use this tool to completely reset the database for UAT testing. This will delete ALL data and users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Database State</h3>
              <Button
                onClick={checkDatabaseState}
                variant="outlined"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            {dbStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Home className="h-4 w-4" />
                      Households
                    </div>
                    <div className="text-2xl font-bold">{dbStats.households}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      Profiles
                    </div>
                    <div className="text-2xl font-bold">{dbStats.profiles}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Events
                    </div>
                    <div className="text-2xl font-bold">{dbStats.events}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      User Roles
                    </div>
                    <div className="text-2xl font-bold">{dbStats.userRoles}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Instances
                    </div>
                    <div className="text-2xl font-bold">{dbStats.instances}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Settings className="h-4 w-4" />
                      Settings
                    </div>
                    <div className="text-2xl font-bold">{dbStats.settings}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive">
                  Warning: This action cannot be undone!
                </p>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                  <li>All user accounts and authentication data</li>
                  <li>All households and their settings</li>
                  <li>All calendar events and instances</li>
                  <li>All user roles and permissions</li>
                  <li>All invitations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            onClick={() => setShowDialog(true)}
            variant="destructive"
            size="lg"
            className="w-full"
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Resetting Database...
              </>
            ) : (
              <>
                <Database className="h-5 w-5 mr-2" />
                Reset Database
              </>
            )}
          </Button>

          {/* Back Link */}
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              disabled={resetting}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all data from the database. This action cannot be undone.
              You will need to set up a new admin account after this reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
