import { FamilyEvent, RecurrenceSlot } from "@/types/event";
import { EventCard } from "./EventCard";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  events: FamilyEvent[];
  onEventClick: (event: FamilyEvent) => void;
}

interface DayEvent {
  event: FamilyEvent;
  slot: RecurrenceSlot;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Map events to their days based on recurrence slots
  const getEventsForDay = (date: Date): DayEvent[] => {
    const dayOfWeek = date.getDay();
    const dayEvents: DayEvent[] = [];

    events.forEach(event => {
      // Check if event is active on this date
      if (event.startDate > date) return;
      if (event.endDate && event.endDate < date) return;

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
    <div className="surface-elevation-2 rounded-3xl overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);

          return (
            <div key={day.toISOString()} className="min-h-[500px] bg-surface">
              <div
                className={cn(
                  "p-4 text-center border-b border-border",
                  today && "bg-primary-container"
                )}
              >
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-2xl font-normal mt-1",
                    today ? "text-on-primary-container font-medium" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>

              <div className="p-3 space-y-2">
                {dayEvents.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8 font-normal">
                    No events
                  </div>
                ) : (
                  dayEvents.map(({ event, slot }, index) => (
                    <EventCard
                      key={`${event.id}-${index}`}
                      event={event}
                      startTime={slot.startTime}
                      endTime={slot.endTime}
                      onClick={() => onEventClick(event)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
