import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Settings, Car, User, MapPin, Copy, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEventsDB } from "@/hooks/useEventsDB";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
import { useEventInstancesDB } from "@/hooks/useEventInstancesDB";
import { AdminBootstrap } from "@/components/AdminBootstrap";
import { OnboardingTour } from "@/components/OnboardingTour";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay, getDay } from "date-fns";
import { FamilyEvent } from "@/types/event";
import dashboardBg from "@/assets/dashboard-bg.png";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { householdId, householdName, displayUrl, canEdit, loading: householdLoading, userRole } = useHousehold();
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
  const { settings, getFamilyMemberName } = useFamilySettingsDB();

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
      
      {householdLoading ? (
        <div className="container mx-auto px-4 py-8 relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your household...</p>
          </div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-8 space-y-4">
            {/* Row 1: Family Name + Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-foreground">{householdName}</h2>
                {user && userRole && <UserRoleBadge role={userRole} />}
              </div>
              <ThemeToggle />
            </div>

            {/* Row 2: Action Buttons - Right aligned */}
            {user ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
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
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
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
              </div>
            ) : (
              <div className="flex justify-end">
                <Button
                  variant="filled"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </div>
            )}
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
              <Button className="w-full justify-start" variant="filled" onClick={() => navigate("/calendar", { state: { openEventDialog: true } })}>
                <Calendar className="mr-2 h-4 w-4" />
                Add Event
              </Button>
              <Button className="w-full justify-start" variant="outlined" onClick={() => navigate("/calendar")}>
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
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

        {/* UAT Reset Access - Always visible */}
        <div className="text-center mt-8 pb-4">
          <Link to="/reset" className="text-xs text-muted-foreground hover:text-primary underline">
            Reset Database (UAT)
          </Link>
        </div>
      </main>
      )}


      {!user && <AdminBootstrap />}
      {user && <OnboardingTour userId={user.id} />}
    </div>
  );
};

export default Dashboard;
