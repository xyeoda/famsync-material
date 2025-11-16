import { useState } from "react";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { WeekView } from "@/components/Calendar/WeekView";
import { MonthView } from "@/components/Calendar/MonthView";
import { EventDialog } from "@/components/Calendar/EventDialog";
import { useEvents } from "@/hooks/useEvents";
import { FamilyEvent } from "@/types/event";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | undefined>(undefined);
  const { events, addEvent, updateEvent } = useEvents();
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
    setSelectedEvent(undefined);
    setEventDialogOpen(true);
  };

  const handleEventClick = (event: FamilyEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const handleSaveEvent = (event: FamilyEvent) => {
    if (selectedEvent) {
      updateEvent(event.id, event);
      toast({
        title: "Event Updated",
        description: `${event.title} has been updated successfully.`,
      });
    } else {
      addEvent(event);
      toast({
        title: "Event Created",
        description: `${event.title} has been added to your schedule.`,
      });
    }
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

        <EventDialog
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          onSave={handleSaveEvent}
          event={selectedEvent}
        />
      </div>
    </div>
  );
};

export default Index;
