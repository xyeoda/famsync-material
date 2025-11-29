import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Users, Palette, Trash2, Shield, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
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

// Color conversion utilities
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v, i) => {
    const num = parseFloat(v);
    return i === 0 ? num : num / 100;
  });
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  
  const r = f(0).toString(16).padStart(2, '0');
  const g = f(8).toString(16).padStart(2, '0');
  const b = f(4).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

export default function Settings() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { householdId, householdName, displayUrl, canEdit, loading: householdLoading } = useHousehold();
  const { settings, updateSettings } = useFamilySettingsDB();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editedHouseholdName, setEditedHouseholdName] = useState(householdName);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setEditedHouseholdName(householdName);
  }, [householdName]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Show loading state while permissions are being checked
  if (householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        description: "All data wiped. Redirecting to setup...",
      });

      // Clear all localStorage
      localStorage.clear();
      
      // Sign out and redirect to home page
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
    if (!householdId || !editedHouseholdName.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("households")
        .update({ name: editedHouseholdName.trim() })
        .eq("id", householdId);

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

  const handleUpdateFamilyMember = async (field: string, value: string) => {
    const updatedSettings = {
      ...settings,
      [field]: value,
    };
    await updateSettings(updatedSettings);
  };

  const handleColorChange = (field: string, hex: string) => {
    const hsl = hexToHsl(hex);
    handleUpdateFamilyMember(field, hsl);
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
            onClick={() => navigate("/")}
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

          {/* Family Members */}
          <Card className="bg-card/80 backdrop-blur-md border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Family Members</CardTitle>
              </div>
              <CardDescription>Customize family member names</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent1-name">Parent 1 Name</Label>
                  <Input
                    id="parent1-name"
                    value={settings.parent1Name || ""}
                    onChange={(e) => handleUpdateFamilyMember("parent1Name", e.target.value)}
                    placeholder="Parent 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent2-name">Parent 2 Name</Label>
                  <Input
                    id="parent2-name"
                    value={settings.parent2Name || ""}
                    onChange={(e) => handleUpdateFamilyMember("parent2Name", e.target.value)}
                    placeholder="Parent 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid1-name">Kid 1 Name</Label>
                  <Input
                    id="kid1-name"
                    value={settings.kid1Name || ""}
                    onChange={(e) => handleUpdateFamilyMember("kid1Name", e.target.value)}
                    placeholder="Kid 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid2-name">Kid 2 Name</Label>
                  <Input
                    id="kid2-name"
                    value={settings.kid2Name || ""}
                    onChange={(e) => handleUpdateFamilyMember("kid2Name", e.target.value)}
                    placeholder="Kid 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="housekeeper-name">Housekeeper Name</Label>
                  <Input
                    id="housekeeper-name"
                    value={settings.housekeeperName || ""}
                    onChange={(e) => handleUpdateFamilyMember("housekeeperName", e.target.value)}
                    placeholder="Housekeeper"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card className="bg-card/80 backdrop-blur-md border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Color Customization</CardTitle>
              </div>
              <CardDescription>Click the colored buttons to pick a color</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent1-color">Parent 1 Color</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outlined"
                      className="w-full h-12 justify-start gap-3 pointer-events-none"
                      style={{ 
                        backgroundColor: `hsl(${settings.parent1Color})`,
                        borderColor: `hsl(${settings.parent1Color})`
                      }}
                    >
                      <Palette className="h-5 w-5" style={{ color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                      <span style={{ color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Click to change color
                      </span>
                    </Button>
                    <input
                      type="color"
                      id="parent1-color"
                      value={hslToHex(settings.parent1Color || "210 40% 50%")}
                      onChange={(e) => handleColorChange("parent1Color", e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent2-color">Parent 2 Color</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outlined"
                      className="w-full h-12 justify-start gap-3 pointer-events-none"
                      style={{ 
                        backgroundColor: `hsl(${settings.parent2Color})`,
                        borderColor: `hsl(${settings.parent2Color})`
                      }}
                    >
                      <Palette className="h-5 w-5" style={{ color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                      <span style={{ color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Click to change color
                      </span>
                    </Button>
                    <input
                      type="color"
                      id="parent2-color"
                      value={hslToHex(settings.parent2Color || "280 40% 50%")}
                      onChange={(e) => handleColorChange("parent2Color", e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid1-color">Kid 1 Color</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outlined"
                      className="w-full h-12 justify-start gap-3 pointer-events-none"
                      style={{ 
                        backgroundColor: `hsl(${settings.kid1Color})`,
                        borderColor: `hsl(${settings.kid1Color})`
                      }}
                    >
                      <Palette className="h-5 w-5" style={{ color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                      <span style={{ color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Click to change color
                      </span>
                    </Button>
                    <input
                      type="color"
                      id="kid1-color"
                      value={hslToHex(settings.kid1Color || "150 40% 50%")}
                      onChange={(e) => handleColorChange("kid1Color", e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid2-color">Kid 2 Color</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outlined"
                      className="w-full h-12 justify-start gap-3 pointer-events-none"
                      style={{ 
                        backgroundColor: `hsl(${settings.kid2Color})`,
                        borderColor: `hsl(${settings.kid2Color})`
                      }}
                    >
                      <Palette className="h-5 w-5" style={{ color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                      <span style={{ color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Click to change color
                      </span>
                    </Button>
                    <input
                      type="color"
                      id="kid2-color"
                      value={hslToHex(settings.kid2Color || "30 40% 50%")}
                      onChange={(e) => handleColorChange("kid2Color", e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="housekeeper-color">Housekeeper Color</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outlined"
                      className="w-full h-12 justify-start gap-3 pointer-events-none"
                      style={{ 
                        backgroundColor: `hsl(${settings.housekeeperColor})`,
                        borderColor: `hsl(${settings.housekeeperColor})`
                      }}
                    >
                      <Palette className="h-5 w-5" style={{ color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />
                      <span style={{ color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        Click to change color
                      </span>
                    </Button>
                    <input
                      type="color"
                      id="housekeeper-color"
                      value={hslToHex(settings.housekeeperColor || "180 30% 50%")}
                      onChange={(e) => handleColorChange("housekeeperColor", e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="bg-card/80 backdrop-blur-md border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Household Members</CardTitle>
              </div>
              <CardDescription>Invite and manage household users</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setUserManagementOpen(true)} className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card/80 backdrop-blur-md border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible actions - proceed with caution</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={resetting}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {resetting ? "Resetting Database..." : "Reset Database"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Reset Database</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently DELETE ALL data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All users and their accounts</li>
                        <li>All events and calendar data</li>
                        <li>All pending invitations</li>
                        <li>All household settings</li>
                      </ul>
                      <p className="mt-3 font-semibold text-destructive">This action CANNOT be undone!</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetDatabase} className="bg-destructive hover:bg-destructive/90">
                      Yes, Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* User Management Dialog */}
      <UserManagementDialog
        open={userManagementOpen}
        onOpenChange={setUserManagementOpen}
        householdId={householdId || ""}
        householdName={householdName}
      />
    </div>
  );
}
