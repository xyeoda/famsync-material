import { FamilyEvent } from "@/types/event";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isSameDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  currentDate: Date;
  events: FamilyEvent[];
  onEventClick: (event: FamilyEvent) => void;
}

export function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    <div className="surface-elevation-2 rounded-3xl overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-border">
        {weekDays.map(day => (
          <div key={day} className="bg-surface-container p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          const inCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[120px] bg-surface p-3",
                !inCurrentMonth && "bg-surface-variant opacity-60"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={cn(
                    "text-sm font-normal",
                    today && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-medium",
                    !inCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs bg-primary-container text-on-primary-container px-2 py-1 rounded-full font-medium">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                      "text-xs p-2 rounded-lg cursor-pointer hover:shadow-elevation-1 transition-standard truncate state-layer",
                      `category-${event.category}`,
                      "text-white font-medium"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-2 font-normal">
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
