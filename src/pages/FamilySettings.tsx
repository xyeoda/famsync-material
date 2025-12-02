import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Home, Users, Trash2, Shield, Copy, FileJson, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/app-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserManagementDialog } from "@/components/UserManagement/UserManagementDialog";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import dashboardBg from "@/assets/dashboard-bg.png";
import { ActivityLocationsCard } from "@/components/Settings/ActivityLocationsCard";
import { CalendarSyncCard } from "@/components/Settings/CalendarSyncCard";
import { FamilyMembersCard } from "@/components/Settings/FamilyMembersCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FamilySettings() {
  const { householdId: urlHouseholdId } = useParams<{ householdId: string }>();
  const { user, signOut } = useAuth();
  const { householdName, displayUrl } = useHousehold();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editedHouseholdName, setEditedHouseholdName] = useState(householdName);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setEditedHouseholdName(householdName);
  }, [householdName]);

  const handleResetDatabase = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-database", {
        body: {
          resetToken: "RESET_ALL_DATA_NOW",
        },
      });

      if (error) throw error;

      toast({
        title: "Database Reset Complete",
        description: "All data wiped. Redirecting to home...",
      });

      localStorage.clear();
      
      setTimeout(async () => {
        await signOut();
        navigate("/");
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error resetting database:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Could not reset database",
        variant: "destructive",
      });
      setResetting(false);
    }
  };

  const handleUpdateHouseholdName = async () => {
    if (!urlHouseholdId || !editedHouseholdName.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("households")
        .update({ name: editedHouseholdName.trim() })
        .eq("id", urlHouseholdId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Household name updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating household name:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update household name",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDisplayUrl = () => {
    if (displayUrl) {
      navigator.clipboard.writeText(displayUrl);
      toast({
        title: "Display URL Copied",
        description: "Share this link with devices you want to display the calendar on.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.20] dark:opacity-[0.15]"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      
      <main className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outlined"
            onClick={() => navigate(`/family/${urlHouseholdId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your household configuration</p>
          </div>

          <Tabs defaultValue="family" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="family" className="gap-2">
                <Users className="h-4 w-4" />
                Family
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <Shield className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Family Tab */}
            <TabsContent value="family" className="space-y-6">
              {/* Household Settings */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <CardTitle>Household Information</CardTitle>
                  </div>
                  <CardDescription>Configure your household details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="household-name">Household Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="household-name"
                        value={editedHouseholdName}
                        onChange={(e) => setEditedHouseholdName(e.target.value)}
                        placeholder="The Smith Family"
                        disabled={loading}
                      />
                      <Button
                        onClick={handleUpdateHouseholdName}
                        disabled={loading || editedHouseholdName === householdName}
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="display-url">Display Link</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Share this link with devices you want to display the calendar on (read-only access)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="display-url"
                        value={displayUrl || "Loading..."}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyDisplayUrl}
                        disabled={!displayUrl}
                        variant="outlined"
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Family Members */}
              <FamilyMembersCard />
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              {/* Activity Locations */}
              {urlHouseholdId && <ActivityLocationsCard householdId={urlHouseholdId} />}

              {/* Calendar Sync */}
              <CalendarSyncCard />

              {/* Bulk Event Management */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <CardTitle>Bulk Event Management</CardTitle>
                  </div>
                  <CardDescription>Export and import events in bulk with smart duplicate detection</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(`/family/${urlHouseholdId}/bulk-events`)} 
                    variant="outlined" 
                    className="w-full"
                  >
                    <FileJson className="mr-2 h-4 w-4" />
                    Manage Events in Bulk
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              {/* User Management */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>User Management</CardTitle>
                  </div>
                  <CardDescription>Manage family member access</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setUserManagementOpen(true)} variant="outlined" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-card/80 backdrop-blur-md border-border/50 border-destructive/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </div>
                  <CardDescription>Irreversible actions that affect all data</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={resetting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reset Entire Database
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All events and event instances</li>
                            <li>All family settings and customizations</li>
                            <li>All household data</li>
                            <li>All user accounts and roles</li>
                          </ul>
                          You will be logged out and redirected to the home page.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetDatabase}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={resetting}
                        >
                          {resetting ? "Resetting..." : "Yes, Reset Everything"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {urlHouseholdId && (
        <UserManagementDialog 
          open={userManagementOpen} 
          onOpenChange={setUserManagementOpen}
          householdId={urlHouseholdId}
          householdName={householdName}
        />
      )}
    </div>
  );
}