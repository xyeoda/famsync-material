import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, Settings, Car, User, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEventsDB } from "@/hooks/useEventsDB";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
import { useEventInstancesDB } from "@/hooks/useEventInstancesDB";
import { OnboardingTour } from "@/components/OnboardingTour";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { WeeklyTimeline } from "@/components/Dashboard/WeeklyTimeline";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay, getDay } from "date-fns";
import dashboardBg from "@/assets/dashboard-bg.png";
const FamilyDashboard = () => {
  const {
    householdId: urlHouseholdId
  } = useParams<{
    householdId: string;
  }>();
  const {
    user,
    signOut
  } = useAuth();
  const {
    householdName,
    canEdit,
    userRole
  } = useHousehold();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    navigate("/auth");
  };
  const {
    events,
    loadEvents
  } = useEventsDB();
  const {
    instances,
    getInstanceForDate,
    loadInstances
  } = useEventInstancesDB();
  const {
    settings,
    getFamilyMemberName
  } = useFamilySettingsDB();

  // Load data when household ID is available
  useEffect(() => {
    if (urlHouseholdId) {
      loadEvents(urlHouseholdId);
      loadInstances(urlHouseholdId);
    }
  }, [urlHouseholdId]);
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  // Count events happening this week
  const thisWeekEvents = events.filter(event => {
    if (!event.startDate) return false;
    return isWithinInterval(new Date(event.startDate), {
      start: weekStart,
      end: weekEnd
    });
  }).length;

  // Get today's events
  const todayEvents = events.filter(event => {
    if (!event.startDate || !event.recurrenceSlots || event.recurrenceSlots.length === 0) return false;
    const eventStart = new Date(event.startDate);
    if (isSameDay(eventStart, today)) return true;

    // Check if event recurs on today
    const dayOfWeek = getDay(today);
    return event.recurrenceSlots.some(slot => slot.dayOfWeek === dayOfWeek);
  }).sort((a, b) => {
    const timeA = a.recurrenceSlots[0]?.startTime || "00:00";
    const timeB = b.recurrenceSlots[0]?.startTime || "00:00";
    return timeA.localeCompare(timeB);
  });
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.20] dark:opacity-[0.15]" style={{
      backgroundImage: `url(${dashboardBg})`
    }} />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          {/* Header - matching Calendar header style */}
          <div className="surface-elevation-2 rounded-3xl p-4 mb-4 bg-card/80 backdrop-blur-md animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left side: Family Name with Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-foreground">{householdName}</h2>
                {userRole && <UserRoleBadge role={userRole} />}
              </div>

              {/* Right side: User Controls */}
              <div className="flex items-center gap-3">
                {user && <>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outlined" size="sm" onClick={() => navigate(`/family/${urlHouseholdId}/calendar`)} className="gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Calendar</span>
                      </Button>
                      {canEdit && <Button variant="outlined" size="sm" onClick={() => navigate(`/family/${urlHouseholdId}/settings`)} className="gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="hidden sm:inline">Settings</span>
                        </Button>}
                      <Button variant="outlined" size="sm" onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-border hidden md:block" />

                    {/* Theme Toggle */}
                    <ThemeToggle />
                  </>}
              </div>
            </div>
          </div>
        </div>

        <Card className="surface-elevation-1 mb-8 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{
        animationDelay: '0.1s',
        animationFillMode: 'backwards'
      }}>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>{format(today, "EEEE, MMMM d")}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? <p className="text-sm text-muted-foreground py-4">No events scheduled for today</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayEvents.map((event, index) => {
              const instance = getInstanceForDate(event.id, today);

              // Get today's time slot
              const dayOfWeek = getDay(today);
              const todaySlot = event.recurrenceSlots.find(slot => slot.dayOfWeek === dayOfWeek);
              const transportation = instance?.transportation || todaySlot?.transportation || event.transportation;
              const dropOffPerson = transportation?.dropOffPerson;
              const pickUpPerson = transportation?.pickUpPerson;

              // Determine border color based on participants
              const participants = event.participants;
              const bothKids = participants.includes("kid1") && participants.includes("kid2");
              let borderColorStyle = `hsl(${settings.kid1Color})`;
              let borderBackground = undefined;
              if (bothKids) {
                borderBackground = `linear-gradient(to bottom, hsl(${settings.kid1Color}), hsl(${settings.kid2Color}))`;
              } else if (participants.length === 1) {
                const participant = participants[0];
                if (participant === "kid1") borderColorStyle = `hsl(${settings.kid1Color})`;else if (participant === "kid2") borderColorStyle = `hsl(${settings.kid2Color})`;else if (participant === "parent1") borderColorStyle = `hsl(${settings.parent1Color})`;else if (participant === "parent2") borderColorStyle = `hsl(${settings.parent2Color})`;else if (participant === "housekeeper") borderColorStyle = `hsl(${settings.housekeeperColor})`;
              }
              return <Card key={event.id} className={`surface-elevation-2 bg-card/70 backdrop-blur-md border-border/40 animate-fade-in ${bothKids ? 'relative overflow-hidden' : 'border-l-4'}`} style={{
                ...(bothKids ? undefined : {
                  borderLeftColor: borderColorStyle
                }),
                animationDelay: `${0.15 + index * 0.05}s`,
                animationFillMode: 'backwards'
              }}>
                      {bothKids && <div className="absolute left-0 top-0 bottom-0 w-1" style={{
                  background: borderBackground
                }} />}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{event.title}</CardTitle>
                            {todaySlot && <CardDescription className="text-xs mt-1">
                                {todaySlot.startTime} - {todaySlot.endTime}
                              </CardDescription>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {event.participants.map(p => getFamilyMemberName(p)).join(", ")}
                          </span>
                        </div>
                        {event.location && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </a>}
                        {(dropOffPerson || pickUpPerson) && <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Car className="h-3 w-3" />
                            <span>
                              {dropOffPerson && `Drop: ${getFamilyMemberName(dropOffPerson)}`}
                              {dropOffPerson && pickUpPerson && " • "}
                              {pickUpPerson && `Pick: ${getFamilyMemberName(pickUpPerson)}`}
                            </span>
                          </div>}
                      </CardContent>
                    </Card>;
            })}
              </div>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{
          animationDelay: '0.2s',
          animationFillMode: 'backwards'
        }}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your family calendar</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button className="w-full justify-start" variant="filled" onClick={() => navigate(`/family/${urlHouseholdId}/calendar`, {
              state: {
                openEventDialog: true
              }
            })} disabled={!canEdit}>
                <Calendar className="mr-2 h-4 w-4" />
                Add Event
              </Button>
              <Button className="w-full justify-start" variant="outlined" onClick={() => navigate(`/family/${urlHouseholdId}/calendar`)}>
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Activity Distribution Chart */}
          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{
          animationDelay: '0.25s',
          animationFillMode: 'backwards'
        }}>
            <CardHeader>
              <CardTitle>Activity Distribution</CardTitle>
              <CardDescription>Events per family member this week</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
              // Calculate events per family member for this week
              const memberCounts = {
                parent1: 0,
                parent2: 0,
                kid1: 0,
                kid2: 0,
                housekeeper: 0
              };
              events.forEach(event => {
                if (!event.startDate) return;
                const isThisWeek = isWithinInterval(new Date(event.startDate), {
                  start: weekStart,
                  end: weekEnd
                });
                if (isThisWeek) {
                  event.participants.forEach(participant => {
                    if (participant in memberCounts) {
                      memberCounts[participant]++;
                    }
                  });
                }
              });
              const maxCount = Math.max(...Object.values(memberCounts), 1);
              const members = [{
                key: 'parent1',
                name: settings.parent1Name,
                count: memberCounts.parent1,
                color: settings.parent1Color
              }, {
                key: 'parent2',
                name: settings.parent2Name,
                count: memberCounts.parent2,
                color: settings.parent2Color
              }, {
                key: 'kid1',
                name: settings.kid1Name,
                count: memberCounts.kid1,
                color: settings.kid1Color
              }, {
                key: 'kid2',
                name: settings.kid2Name,
                count: memberCounts.kid2,
                color: settings.kid2Color
              }, {
                key: 'housekeeper',
                name: settings.housekeeperName,
                count: memberCounts.housekeeper,
                color: settings.housekeeperColor
              }].filter(member => member.count > 0);
              if (members.length === 0) {
                return <p className="text-sm text-muted-foreground py-4">No events scheduled this week</p>;
              }
              return <div className="space-y-4">
                    {members.map((member, index) => <div key={member.key} className="space-y-2 animate-fade-in" style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                  animationFillMode: 'backwards'
                }}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{member.name}</span>
                          <span className="text-muted-foreground">{member.count} {member.count === 1 ? 'event' : 'events'}</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                      width: `${member.count / maxCount * 100}%`,
                      backgroundColor: `hsl(${member.color})`,
                      transitionDelay: `${0.3 + index * 0.05}s`
                    }} />
                        </div>
                      </div>)}
                  </div>;
            })()}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{
        animationDelay: '0.3s',
        animationFillMode: 'backwards'
      }}>
          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{
          animationDelay: '0.35s',
          animationFillMode: 'backwards'
        }}>
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

          <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{
          animationDelay: '0.4s',
          animationFillMode: 'backwards'
        }}>
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

        {/* Weekly Timeline Visualization */}
        <div className="mt-8">
          <WeeklyTimeline events={events} instances={instances} weekStart={weekStart} />
        </div>

        {/* UAT Reset Access - Always visible for parents */}
        {canEdit && <div className="text-center mt-8 pb-4">
            <Link to="/reset" className="text-xs text-muted-foreground hover:text-primary underline">
              Reset Database (UAT)
            </Link>
          </div>}
      </main>

      {user && urlHouseholdId && <OnboardingTour userId={user.id} householdId={urlHouseholdId} />}
    </div>;
};
export default FamilyDashboard;