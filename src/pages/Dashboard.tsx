import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Settings, Car, User, MapPin, Copy, LogIn, LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEventsDB } from "@/hooks/useEventsDB";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
import { useEventInstancesDB } from "@/hooks/useEventInstancesDB";
import { FamilySettingsDialog } from "@/components/Calendar/FamilySettingsDialog";
import { UserManagementDialog } from "@/components/UserManagement/UserManagementDialog";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay, getDay } from "date-fns";
import { FamilyEvent } from "@/types/event";
import dashboardBg from "@/assets/dashboard-bg.png";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { householdId, householdName, displayUrl, canEdit } = useHousehold();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };
  
  const { events, loadEvents } = useEventsDB();
  const { instances, getInstanceForDate, loadInstances } = useEventInstancesDB();
  const { settings, updateSettings, resetSettings, getFamilyMemberName } = useFamilySettingsDB();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);

  // Load data when household ID is available
  useEffect(() => {
    if (householdId) {
      loadEvents(householdId);
      loadInstances(householdId);
    }
  }, [householdId]);

  const handleCopyDisplayUrl = () => {
    if (displayUrl) {
      navigator.clipboard.writeText(displayUrl);
      toast({
        title: "Display URL Copied",
        description: "Share this link with devices you want to display the calendar on.",
      });
    }
  };

  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  // Count events happening this week
  const thisWeekEvents = events.filter((event) => {
    if (!event.startDate) return false;
    return isWithinInterval(new Date(event.startDate), { start: weekStart, end: weekEnd });
  }).length;

  // Get today's events
  const todayEvents = events
    .filter((event) => {
      if (!event.startDate || !event.recurrenceSlots || event.recurrenceSlots.length === 0) return false;

      const eventStart = new Date(event.startDate);
      if (isSameDay(eventStart, today)) return true;

      // Check if event recurs on today
      const dayOfWeek = getDay(today);

      return event.recurrenceSlots.some((slot) => slot.dayOfWeek === dayOfWeek);
    })
    .sort((a, b) => {
      const timeA = a.recurrenceSlots[0]?.startTime || "00:00";
      const timeB = b.recurrenceSlots[0]?.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.20] dark:opacity-[0.15]"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">{householdName}</h2>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {displayUrl && (
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={handleCopyDisplayUrl}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Display Link
                  </Button>
                )}
                {canEdit && (
                  <>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setUserManagementOpen(true)}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button
                      variant="text"
                      size="icon"
                      onClick={() => setSettingsOpen(true)}
                      className="h-10 w-10 rounded-full"
                      title="Family Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="filled"
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        <Card className="surface-elevation-1 mb-8 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>{format(today, "EEEE, MMMM d")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No events scheduled for today</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayEvents.map((event) => {
                  const instance = getInstanceForDate(event.id, today);
                  const transportation = instance?.transportation || event.transportation;
                  const dropOffPerson = transportation?.dropOffPerson;
                  const pickUpPerson = transportation?.pickUpPerson;

                  // Get today's time slot
                  const dayOfWeek = getDay(today);
                  const todaySlot = event.recurrenceSlots.find((slot) => slot.dayOfWeek === dayOfWeek);

                  // Determine border color based on participants
                  const participants = event.participants;
                  const bothKids = participants.includes("kid1") && participants.includes("kid2");
                  
                  let borderColorStyle = `hsl(${settings.kid1Color})`;
                  let borderBackground = undefined;
                  
                  if (bothKids) {
                    borderBackground = `linear-gradient(to bottom, hsl(${settings.kid1Color}), hsl(${settings.kid2Color}))`;
                  } else if (participants.length === 1) {
                    const participant = participants[0];
                    if (participant === "kid1") borderColorStyle = `hsl(${settings.kid1Color})`;
                    else if (participant === "kid2") borderColorStyle = `hsl(${settings.kid2Color})`;
                    else if (participant === "parent1") borderColorStyle = `hsl(${settings.parent1Color})`;
                    else if (participant === "parent2") borderColorStyle = `hsl(${settings.parent2Color})`;
                    else if (participant === "housekeeper") borderColorStyle = `hsl(${settings.housekeeperColor})`;
                  }

                  return (
                    <Card 
                      key={event.id} 
                      className={`surface-elevation-2 bg-card/70 backdrop-blur-md border-border/40 ${bothKids ? 'relative overflow-hidden' : 'border-l-4'}`}
                      style={!bothKids ? { borderLeftColor: borderColorStyle } : undefined}
                    >
                      {bothKids && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ 
                            background: borderBackground
                          }}
                        />
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{event.title}</CardTitle>
                            {todaySlot && (
                              <CardDescription className="text-xs mt-1">
                                {todaySlot.startTime} - {todaySlot.endTime}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {event.participants.map((p) => getFamilyMemberName(p)).join(", ")}
                          </span>
                        </div>
                        {event.location && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </a>
                        )}
                        {(dropOffPerson || pickUpPerson) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" />
                            <span>
                              {dropOffPerson && `Drop: ${getFamilyMemberName(dropOffPerson)}`}
                              {dropOffPerson && pickUpPerson && " • "}
                              {pickUpPerson && `Pick: ${getFamilyMemberName(pickUpPerson)}`}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50">
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
              {canEdit && (
                <>
                  <Button className="w-full justify-start" variant="outlined" onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Family Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outlined" onClick={() => setUserManagementOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50">
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

          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">Recurring activities</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {user && canEdit && (
        <>
          <FamilySettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settings={settings}
            onSave={updateSettings}
            onReset={resetSettings}
          />
          {householdId && (
            <UserManagementDialog
              open={userManagementOpen}
              onOpenChange={setUserManagementOpen}
              householdId={householdId}
              householdName={householdName}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
