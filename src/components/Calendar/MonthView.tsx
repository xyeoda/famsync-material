import { FamilyEvent, EventInstance } from "@/types/event";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isSameDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  currentDate: Date;
  events: FamilyEvent[];
  instances: EventInstance[];
  onEventClick: (event: FamilyEvent, date: Date) => void;
}

export function MonthView({ currentDate, events, instances, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getInstanceForDate = (eventId: string, date: Date): EventInstance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return instances.find(instance => {
      const instanceDateStr = instance.date.toISOString().split('T')[0];
      return instance.eventId === eventId && instanceDateStr === dateStr;
    });
  };

  const getEventsForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return events.filter(event => {
      if (event.startDate > date) return false;
      if (event.endDate && event.endDate < date) return false;
      return event.recurrenceSlots.some(slot => slot.dayOfWeek === dayOfWeek);
    });
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
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
                "min-h-[90px] bg-surface dark:bg-surface-container p-2",
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
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event, day)}
                    className={cn(
                      "text-[10px] p-1.5 rounded-lg cursor-pointer hover:shadow-elevation-1 dark:hover:bg-surface-container-high transition-standard truncate state-layer border-l-2 bg-surface-container dark:bg-surface-container-high",
                      `category-${event.category}`,
                      "font-medium dark:text-foreground/90"
                    )}
                    style={{ borderLeftColor: `hsl(var(--category-${event.category}))` }}
                  >
                    {event.title}
                  </div>
                ))}
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
  );
}
