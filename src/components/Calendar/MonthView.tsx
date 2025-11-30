import { FamilyEvent, EventInstance, FamilyMember } from "@/types/event";
import { TransportationLegend } from "./TransportationLegend";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isSameDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { useFamilySettingsContext } from "@/contexts/FamilySettingsContext";

interface MonthViewProps {
  currentDate: Date;
  events: FamilyEvent[];
  instances: EventInstance[];
  onEventClick: (event: FamilyEvent, date: Date) => void;
}

export function MonthView({ currentDate, events, instances, onEventClick }: MonthViewProps) {
  const { settings } = useFamilySettingsContext();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getMemberColor = (member: FamilyMember) => {
    if (member === "parent1") return settings.parent1Color;
    if (member === "parent2") return settings.parent2Color;
    if (member === "housekeeper") return settings.housekeeperColor;
    return null;
  };

  const getInstanceForDate = (eventId: string, date: Date): EventInstance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return instances.find(instance => {
      const instanceDateStr = instance.date.toISOString().split('T')[0];
      return instance.eventId === eventId && instanceDateStr === dateStr;
    });
  };

  const getEventsForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return events
      .filter(event => {
        if (event.startDate > date) return false;
        if (event.endDate && event.endDate < date) return false;
        
        return event.recurrenceSlots.some(slot => slot.dayOfWeek === dayOfWeek);
      })
      .map(event => ({
        event,
        slot: event.recurrenceSlots.find(slot => slot.dayOfWeek === dayOfWeek)!
      }));
  };

  const getEventBorderColor = (event: FamilyEvent) => {
    const kidsInvolved = event.participants.filter((p: FamilyMember) => p === "kid1" || p === "kid2");
    if (kidsInvolved.length === 2) {
      return 'linear-gradient(to bottom, hsl(var(--kid1-color)), hsl(var(--kid2-color)))';
    } else if (kidsInvolved.length === 1) {
      return `hsl(var(--${kidsInvolved[0]}-color))`;
    }
    return `hsl(var(--category-${event.category}))`;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <>
      <div className="surface-elevation-2 rounded-3xl overflow-hidden border-2 border-border dark:border-border/60">
        <div className="grid grid-cols-7 gap-px bg-border dark:bg-border/40">
          {weekDays.map(day => (
            <div key={day} className="bg-surface-container dark:bg-surface-container-high p-4 text-center">
              <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-wide">
                {day}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-border dark:bg-border/40">
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);
            const inCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] bg-surface dark:bg-surface-container p-2",
                  !inCurrentMonth && "bg-surface-variant dark:bg-surface-container-low opacity-60 dark:opacity-50"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "text-xs font-normal dark:text-foreground/90",
                      today && "bg-primary text-primary-foreground dark:bg-primary/90 rounded-full w-6 h-6 flex items-center justify-center font-medium text-xs",
                      !inCurrentMonth && "text-muted-foreground dark:text-muted-foreground/60"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] bg-primary-container dark:bg-primary-container/80 text-on-primary-container dark:text-on-primary-container/90 px-1.5 py-0.5 rounded-full font-medium">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(({ event, slot }) => {
                    const kidsInvolved = event.participants.filter((p: FamilyMember) => p === "kid1" || p === "kid2");
                    const borderColor = getEventBorderColor(event);
                    const isGradient = kidsInvolved.length === 2;
                    const instance = getInstanceForDate(event.id, day);
                    const transportation = instance?.transportation || slot?.transportation || event.transportation;
                    
                    const dropOffColor = transportation?.dropOffPerson ? getMemberColor(transportation.dropOffPerson) : null;
                    const pickUpColor = transportation?.pickUpPerson ? getMemberColor(transportation.pickUpPerson) : null;

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event, day)}
                        className={cn(
                          "text-[10px] p-1.5 rounded-lg cursor-pointer hover:shadow-elevation-1 dark:hover:bg-surface-container-high transition-standard state-layer bg-surface-container dark:bg-surface-container-high relative",
                          `category-${event.category}`,
                          "font-medium dark:text-foreground/90",
                          !isGradient && "border-l-2"
                        )}
                        style={!isGradient ? { borderLeftColor: borderColor } : undefined}
                      >
                        {isGradient && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-0.5"
                            style={{ 
                              background: borderColor
                            }}
                          />
                        )}
                        <div className="truncate font-medium">{event.title}</div>
                        {event.location && (
                          <div className="flex items-center gap-0.5 text-muted-foreground opacity-80">
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {/* Bottom transportation strip */}
                        {(dropOffColor || pickUpColor) && (
                          <div className="absolute bottom-0 left-0 right-0 flex h-1 rounded-b-lg overflow-hidden">
                            <div 
                              className="flex-1"
                              style={{ backgroundColor: dropOffColor ? `hsl(${dropOffColor})` : 'transparent' }}
                            />
                            <div 
                              className="flex-1"
                              style={{ backgroundColor: pickUpColor ? `hsl(${pickUpColor})` : 'transparent' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground dark:text-muted-foreground/80 pl-1.5 font-normal">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <TransportationLegend />
    </>
  );
}
