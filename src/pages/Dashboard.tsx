import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Settings, Car, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEvents } from "@/hooks/useEvents";
import { useFamilySettings } from "@/hooks/useFamilySettings";
import { useEventInstances } from "@/hooks/useEventInstances";
import { FamilySettingsDialog } from "@/components/Calendar/FamilySettingsDialog";
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameDay, getDay } from "date-fns";
import { FamilyEvent } from "@/types/event";

const Dashboard = () => {
  const { events } = useEvents();
  const { instances, getInstanceForDate } = useEventInstances();
  const { settings, updateSettings, resetSettings, getFamilyMemberName } = useFamilySettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <h2 className="text-3xl font-bold text-foreground mb-2">YeoDa Family</h2>
          <p className="text-muted-foreground">{format(today, "EEEE, MMMM d, yyyy")}</p>
        </div>

        <Card className="surface-elevation-1 mb-8">
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
                  let borderColor = "border-l-primary";
                  const kidsParticipating = event.participants.filter((p) => p === "kid1" || p === "kid2");
                  if (kidsParticipating.length === 1) {
                    borderColor = kidsParticipating.includes("kid1") ? "border-l-kid1" : "border-l-kid2";
                  } else if (kidsParticipating.length === 2) {
                    borderColor = "border-l-kid1";
                  }

                  return (
                    <Card key={event.id} className={`surface-elevation-2 border-l-4 ${borderColor}`}>
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
                        {dropOffPerson && (
                          <div className="flex items-center gap-2 text-xs">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Drop: {getFamilyMemberName(dropOffPerson)}</span>
                          </div>
                        )}
                        {pickUpPerson && (
                          <div className="flex items-center gap-2 text-xs">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Pick: {getFamilyMemberName(pickUpPerson)}</span>
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
              <Button className="w-full justify-start" variant="outlined" onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Family Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
