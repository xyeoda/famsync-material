import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Users, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import dashboardBg from "@/assets/dashboard-bg.png";

export default function Settings() {
  const { user } = useAuth();
  const { householdId, householdName, canEdit } = useHousehold();
  const { settings, updateSettings } = useFamilySettingsDB();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editedHouseholdName, setEditedHouseholdName] = useState(householdName);

  useEffect(() => {
    setEditedHouseholdName(householdName);
  }, [householdName]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!canEdit) {
    navigate("/");
    return null;
  }

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
              <CardDescription>Customize family member colors (HSL format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent1-color">Parent 1 Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="parent1-color"
                      value={settings.parent1Color || ""}
                      onChange={(e) => handleUpdateFamilyMember("parent1Color", e.target.value)}
                      placeholder="210, 40%, 50%"
                    />
                    <div
                      className="h-10 w-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${settings.parent1Color})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent2-color">Parent 2 Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="parent2-color"
                      value={settings.parent2Color || ""}
                      onChange={(e) => handleUpdateFamilyMember("parent2Color", e.target.value)}
                      placeholder="280, 40%, 50%"
                    />
                    <div
                      className="h-10 w-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${settings.parent2Color})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid1-color">Kid 1 Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="kid1-color"
                      value={settings.kid1Color || ""}
                      onChange={(e) => handleUpdateFamilyMember("kid1Color", e.target.value)}
                      placeholder="150, 40%, 50%"
                    />
                    <div
                      className="h-10 w-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${settings.kid1Color})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kid2-color">Kid 2 Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="kid2-color"
                      value={settings.kid2Color || ""}
                      onChange={(e) => handleUpdateFamilyMember("kid2Color", e.target.value)}
                      placeholder="30, 40%, 50%"
                    />
                    <div
                      className="h-10 w-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${settings.kid2Color})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="housekeeper-color">Housekeeper Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="housekeeper-color"
                      value={settings.housekeeperColor || ""}
                      onChange={(e) => handleUpdateFamilyMember("housekeeperColor", e.target.value)}
                      placeholder="180, 30%, 50%"
                    />
                    <div
                      className="h-10 w-10 rounded border border-border"
                      style={{ backgroundColor: `hsl(${settings.housekeeperColor})` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
