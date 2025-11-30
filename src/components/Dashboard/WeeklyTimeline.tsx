import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday, getDay, parse } from "date-fns";
import { FamilyEvent, EventInstance } from "@/types/event";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Bus, PersonStanding, Bike } from "lucide-react";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";

interface WeeklyTimelineProps {
  events: FamilyEvent[];
  instances: EventInstance[];
  weekStart: Date;
}

export function WeeklyTimeline({ events, instances, weekStart }: WeeklyTimelineProps) {
  const { getFamilyMemberName, settings } = useFamilySettingsDB();

  const transportIcons = {
    car: Car,
    bus: Bus,
    walk: PersonStanding,
    bike: Bike,
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
  }, []);

  // Group events by day and time
  const eventsByDayAndTime = useMemo(() => {
    const grid: Map<string, FamilyEvent[]> = new Map();

    weekDays.forEach((day, dayIndex) => {
      const dayOfWeek = getDay(day);

      events.forEach((event) => {
        event.recurrenceSlots.forEach((slot) => {
          if (slot.dayOfWeek === dayOfWeek) {
            const startHour = parseInt(slot.startTime.split(':')[0]);
            const key = `${dayIndex}-${startHour}`;
            
            if (!grid.has(key)) {
              grid.set(key, []);
            }
            grid.get(key)?.push(event);
          }
        });
      });
    });

    return grid;
  }, [events, weekDays]);

  const getEventColor = (event: FamilyEvent) => {
    const primaryParticipant = event.participants[0];
    if (!primaryParticipant) return 'hsl(var(--primary))';
    
    const colorMap = {
      parent1: settings.parent1Color,
      parent2: settings.parent2Color,
      kid1: settings.kid1Color,
      kid2: settings.kid2Color,
      housekeeper: settings.housekeeperColor,
    };
    
    return `hsl(${colorMap[primaryParticipant]})`;
  };

  const getInstanceTransportation = (eventId: string, date: Date) => {
    const instance = instances.find(
      (inst) => inst.eventId === eventId && 
                format(new Date(inst.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return instance?.transportation;
  };

  return (
    <Card className="surface-elevation-1 bg-card/80 backdrop-blur-md border-border/50 animate-fade-in" style={{ animationDelay: '0.45s', animationFillMode: 'backwards' }}>
      <CardHeader>
        <CardTitle className="text-xl">Weekly Timeline</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header with days */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`text-center p-2 rounded-lg transition-colors animate-fade-in ${
                  isToday(day) 
                    ? 'bg-primary/20 text-primary font-bold' 
                    : 'text-foreground'
                }`}
                style={{ animationDelay: `${0.5 + index * 0.05}s`, animationFillMode: 'backwards' }}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-sm">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div className="space-y-1">
            {timeSlots.map((hour, hourIndex) => (
              <div 
                key={hour} 
                className="grid grid-cols-8 gap-2 animate-fade-in"
                style={{ animationDelay: `${0.55 + hourIndex * 0.02}s`, animationFillMode: 'backwards' }}
              >
                {/* Time label */}
                <div className="text-xs text-muted-foreground p-2 flex items-center">
                  {format(parse(`${hour}:00`, 'H:mm', new Date()), 'ha')}
                </div>

                {/* Day cells */}
                {weekDays.map((day, dayIndex) => {
                  const key = `${dayIndex}-${hour}`;
                  const eventsInSlot = eventsByDayAndTime.get(key) || [];

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[60px] p-1 rounded-lg border transition-all duration-200 ${
                        eventsInSlot.length > 0
                          ? 'border-border/50 hover:border-primary/50 cursor-pointer hover:scale-[1.02]'
                          : 'border-border/20 bg-muted/5'
                      }`}
                    >
                      {eventsInSlot.map((event, eventIndex) => {
                        const slot = event.recurrenceSlots.find(s => s.dayOfWeek === getDay(day));
                        const transportation = getInstanceTransportation(event.id, day) || slot?.transportation || event.transportation;
                        const DropOffIcon = transportation?.dropOffMethod ? transportIcons[transportation.dropOffMethod] : null;
                        const PickUpIcon = transportation?.pickUpMethod ? transportIcons[transportation.pickUpMethod] : null;

                        return (
                          <div
                            key={eventIndex}
                            className="p-2 rounded-md text-xs mb-1 last:mb-0 transition-all duration-300 hover:shadow-md"
                            style={{
                              backgroundColor: getEventColor(event),
                              opacity: 0.9,
                            }}
                          >
                            <div className="font-medium text-white text-shadow-sm line-clamp-1">
                              {event.title}
                            </div>
                            {slot && (
                              <div className="text-[10px] text-white/90 mt-0.5">
                                {slot.startTime} - {slot.endTime}
                              </div>
                            )}
                            {transportation && (DropOffIcon || PickUpIcon) && (
                              <div className="flex items-center gap-1 mt-1 text-white/80">
                                {DropOffIcon && (
                                  <span className="flex items-center gap-0.5" title={`Drop-off: ${getFamilyMemberName(transportation.dropOffPerson!)}`}>
                                    <DropOffIcon className="h-3 w-3" />
                                    {transportation.dropOffPerson && (
                                      <span className="text-[9px]">
                                        {getFamilyMemberName(transportation.dropOffPerson)[0]}
                                      </span>
                                    )}
                                  </span>
                                )}
                                {PickUpIcon && (
                                  <span className="flex items-center gap-0.5" title={`Pick-up: ${getFamilyMemberName(transportation.pickUpPerson!)}`}>
                                    <PickUpIcon className="h-3 w-3" />
                                    {transportation.pickUpPerson && (
                                      <span className="text-[9px]">
                                        {getFamilyMemberName(transportation.pickUpPerson)[0]}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                            {event.participants.length > 0 && (
                              <div className="text-[9px] text-white/70 mt-0.5 line-clamp-1">
                                {event.participants.map(p => getFamilyMemberName(p)[0]).join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
