import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEvents } from "@/hooks/useEvents";
import { useFamilySettings } from "@/hooks/useFamilySettings";
import { FamilySettingsDialog } from "@/components/Calendar/FamilySettingsDialog";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

const Dashboard = () => {
  const { events } = useEvents();
  const { settings, updateSettings, resetSettings, getFamilyMembers } = useFamilySettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  
  // Count events happening this week
  const thisWeekEvents = events.filter(event => {
    if (!event.startDate) return false;
    return isWithinInterval(new Date(event.startDate), { start: weekStart, end: weekEnd });
  }).length;

  const familyMembers = getFamilyMembers();
  const activeFamilyMembers = Object.values(familyMembers).filter(name => 
    name && !name.startsWith("Parent") && !name.startsWith("Kid") && !name.startsWith("Housekeeper")
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="surface-elevation-2 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-foreground">Family Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="text"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="h-10 w-10 rounded-full"
                title="Family Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="surface-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisWeekEvents}</div>
              <p className="text-xs text-muted-foreground">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
              </p>
            </CardContent>
          </Card>

          <Card className="surface-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">Recurring activities</p>
            </CardContent>
          </Card>

          <Card className="surface-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Family Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFamilyMembers > 0 ? activeFamilyMembers : 5}</div>
              <p className="text-xs text-muted-foreground">Configured members</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="surface-elevation-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your family calendar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="w-full justify-start" variant="filled">
                <Link to="/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Link>
              </Button>
              <Button
                className="w-full justify-start"
                variant="outlined"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Family Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="surface-elevation-1">
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
              <CardDescription>Current configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(familyMembers).map(([key, name]) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <FamilySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />
    </div>
  );
};

export default Dashboard;
