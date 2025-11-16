import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useEvents } from "@/hooks/useEvents";
import { useEventInstances } from "@/hooks/useEventInstances";
import { Calendar, Clock, Users, Plus, Menu } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
import { generateRecurringDates } from "@/lib/utils";
import { FamilyEvent } from "@/types/event";

const Dashboard = () => {
  const navigate = useNavigate();
  const { members } = useFamilyMembers();
  const { events } = useEvents();
  const { instances } = useEventInstances();

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get events for today
  const today = startOfDay(new Date());
  const todayEvents = events.flatMap(event => {
    const dates = generateRecurringDates(event, today, today);
    return dates.map(date => ({ event, date }));
  });

  // Get upcoming events (next 7 days)
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const upcomingEvents = events.flatMap(event => {
    const dates = generateRecurringDates(event, new Date(), endOfWeek);
    return dates.map(date => ({ event, date })).filter(({ date }) => date > today);
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  const thisWeekCount = upcomingEvents.filter(({ date }) => isThisWeek(date)).length;

  const getTransportInfo = (event: FamilyEvent, date: Date) => {
    const instance = instances.find(i => 
      i.eventId === event.id && 
      startOfDay(i.date).getTime() === startOfDay(date).getTime()
    );
    return instance?.transportation || event.transportation;
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || memberId;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="text" size="icon" onClick={() => navigate("/")}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">FamilyFlow</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-3xl font-bold">{getTimeGreeting()}</h2>
          <p className="text-muted-foreground mt-1">Here's what's happening with your family</p>
        </div>

        {/* Quick Actions */}
        <Button variant="filled" onClick={() => navigate("/")} className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          New Event
        </Button>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 bg-accent/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{todayEvents.length}</div>
                <div className="text-sm text-muted-foreground">Events Today</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-500/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{thisWeekCount}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-green-500/10 cursor-pointer hover:bg-green-500/20 transition-colors" onClick={() => navigate("/family")}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-3xl font-bold">{members.length}</div>
                <div className="text-sm text-muted-foreground">Family Members</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Today's Schedule</h3>
          {todayEvents.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No events scheduled for today</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(({ event, date }, idx) => {
                const slot = event.recurrenceSlots[0];
                const transport = getTransportInfo(event, date);
                
                return (
                  <Card key={idx} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/")}>
                    <div className="flex items-start gap-4">
                      <div className="w-1 h-full rounded-full" style={{ backgroundColor: `hsl(${event.color || '266 100% 60%'})` }} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                          {event.category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {event.category}
                            </span>
                          )}
                        </div>
                        
                        {event.location && (
                          <p className="text-sm text-muted-foreground mb-2">📍 {event.location}</p>
                        )}
                        
                        {transport && (
                          <div className="flex gap-2 text-sm text-muted-foreground">
                            {transport.dropOffPerson && (
                              <span>🚗 → {getMemberName(transport.dropOffPerson)}</span>
                            )}
                            {transport.pickUpPerson && (
                              <span>← 🚗 {getMemberName(transport.pickUpPerson)}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-1 mt-2">
                          {event.participants.map(p => {
                            const member = members.find(m => m.id === p.member);
                            if (!member) return null;
                            return (
                              <div
                                key={p.member}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: `hsl(${member.color})` }}
                                title={member.name}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Coming Up */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Coming Up</h3>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map(({ event, date }, idx) => {
              const slot = event.recurrenceSlots[0];
              const transport = getTransportInfo(event, date);
              const dateLabel = isTomorrow(date) ? "TOMORROW" : format(date, "EEEE").toUpperCase();
              
              return (
                <Card key={idx} className="p-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer" style={{ borderLeftColor: `hsl(${event.color || '266 100% 60%'})` }} onClick={() => navigate("/")}>
                  <div className="flex items-start gap-3">
                    <div className="text-xs font-medium text-primary">{dateLabel}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1">📍 {event.location}</p>
                      )}
                      {transport && (transport.dropOffPerson || transport.pickUpPerson) && (
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          {transport.dropOffPerson && <span>🚗 → {getMemberName(transport.dropOffPerson)}</span>}
                          {transport.pickUpPerson && <span>← 🚗 {getMemberName(transport.pickUpPerson)}</span>}
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        {event.participants.map(p => {
                          const member = members.find(m => m.id === p.member);
                          if (!member) return null;
                          return (
                            <div
                              key={p.member}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
                              style={{ backgroundColor: `hsl(${member.color})` }}
                              title={member.name}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {event.category && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {event.category}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* View Calendar Button */}
        <Button variant="outlined" className="w-full" onClick={() => navigate("/")}>
          View Full Calendar
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
