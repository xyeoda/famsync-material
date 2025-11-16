import { useState } from "react";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { WeekView } from "@/components/Calendar/WeekView";
import { MonthView } from "@/components/Calendar/MonthView";
import { useEvents } from "@/hooks/useEvents";
import { FamilyEvent } from "@/types/event";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const { events } = useEvents();
  const { toast } = useToast();

  const handlePreviousPeriod = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextPeriod = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNewEvent = () => {
    toast({
      title: "Coming Soon",
      description: "Event creation form will open here",
    });
  };

  const handleEventClick = (event: FamilyEvent) => {
    toast({
      title: event.title,
      description: `Category: ${event.category}`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
          onToday={handleToday}
          onNewEvent={handleNewEvent}
        />

        {view === "week" ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
