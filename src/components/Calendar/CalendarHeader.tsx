import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onViewChange: (view: "week" | "month") => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onToday: () => void;
  onNewEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  onNewEvent,
}: CalendarHeaderProps) {
  const title = view === "month" 
    ? format(currentDate, "MMMM yyyy")
    : `Week of ${format(currentDate, "MMM d, yyyy")}`;

  return (
    <div className="surface-elevation-1 rounded-2xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="hidden sm:inline-flex"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousPeriod}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextPeriod}
              className="h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("week")}
              className="h-8"
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange("month")}
              className="h-8"
            >
              Month
            </Button>
          </div>

          <Button
            onClick={onNewEvent}
            className="ml-2 bg-primary hover:bg-primary-light"
          >
            <Plus className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
