import { FamilyEvent, RecurrenceSlot, EventInstance } from "@/types/event";
import { EventCard } from "./EventCard";
import { TransportationLegend } from "./TransportationLegend";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  events: FamilyEvent[];
  instances: EventInstance[];
  onEventClick: (event: FamilyEvent, date: Date) => void;
}

interface DayEvent {
  event: FamilyEvent;
  slot: RecurrenceSlot;
}

export function WeekView({ currentDate, events, instances, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getInstanceForDate = (eventId: string, date: Date): EventInstance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return instances.find(instance => {
      const instanceDateStr = instance.date.toISOString().split('T')[0];
      return instance.eventId === eventId && instanceDateStr === dateStr;
    });
  };

  // Map events to their days based on recurrence slots, showing cancelled instances with visual treatment
  // Helper to get date-only for comparison (in local timezone)
  const getDateOnly = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getEventsForDay = (date: Date): DayEvent[] => {
    const dayOfWeek = date.getDay();
    const dayEvents: DayEvent[] = [];
    const compareDate = getDateOnly(date);

    events.forEach(event => {
      // Check if event is active on this date (using date-only comparison in local timezone)
      const eventStartDate = getDateOnly(event.startDate);
      if (eventStartDate > compareDate) return;
      if (event.endDate) {
        const eventEndDate = getDateOnly(event.endDate);
        if (eventEndDate < compareDate) return;
      }

      // Find matching recurrence slots for this day
      event.recurrenceSlots.forEach(slot => {
        if (slot.dayOfWeek === dayOfWeek) {
          dayEvents.push({ event, slot });
        }
      });
    });

    // Sort by start time
    return dayEvents.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <>
      <div className="surface-elevation-2 rounded-3xl overflow-hidden border-2 border-border dark:border-border/60">
        {/* Desktop: 7 columns, Tablet: 4 columns, Mobile: 1 column */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-px bg-border dark:bg-border/40">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

            return (
              <div key={day.toISOString()} className="min-h-[300px] lg:min-h-[500px] bg-surface dark:bg-surface-container flex flex-col">
                <div
                  className={cn(
                    "p-2 lg:p-3 text-center border-b border-border dark:border-border/40 flex-shrink-0",
                    today && "bg-primary-container dark:bg-primary-container/80"
                  )}
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-2xl lg:text-xl font-normal mt-1",
                      today ? "text-on-primary-container font-medium" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                <div className="p-2 lg:p-2 space-y-2 lg:space-y-1.5 flex-1 overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8 font-normal">
                      No events
                    </div>
                  ) : (
                    dayEvents.map(({ event, slot }, index) => {
                      const instance = getInstanceForDate(event.id, day);
                      return (
                        <EventCard
                          key={`${event.id}-${index}`}
                          event={event}
                          instance={instance}
                          slot={slot}
                          startTime={slot.startTime}
                          endTime={slot.endTime}
                          onClick={() => onEventClick(event, day)}
                        />
                      );
                    })
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
