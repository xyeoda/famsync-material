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
    <div className="surface-elevation-2 rounded-3xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-normal text-foreground">{title}</h1>
          <Button
            variant="text"
            size="sm"
            onClick={onToday}
            className="hidden sm:inline-flex"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <Button
              variant="text"
              size="icon"
              onClick={onPreviousPeriod}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="text"
              size="icon"
              onClick={onNextPeriod}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
            <Button
              variant={view === "week" ? "filled" : "text"}
              size="sm"
              onClick={() => onViewChange("week")}
              className="h-9 px-4"
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "filled" : "text"}
              size="sm"
              onClick={() => onViewChange("month")}
              className="h-9 px-4"
            >
              Month
            </Button>
          </div>

          <Button
            onClick={onNewEvent}
            variant="filled"
            className="ml-2"
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
