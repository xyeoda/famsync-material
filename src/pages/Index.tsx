import { useState } from "react";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { WeekView } from "@/components/Calendar/WeekView";
import { MonthView } from "@/components/Calendar/MonthView";
import { EventDialog } from "@/components/Calendar/EventDialog";
import { InstanceDialog } from "@/components/Calendar/InstanceDialog";
import { BulkDeleteDialog } from "@/components/Calendar/BulkDeleteDialog";
import { useEvents } from "@/hooks/useEvents";
import { useEventInstances } from "@/hooks/useEventInstances";
import { FamilyEvent, EventInstance } from "@/types/event";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedInstance, setSelectedInstance] = useState<EventInstance | undefined>(undefined);
  const { events, addEvent, updateEvent, deleteEventsByTitle } = useEvents();
  const { instances, addInstance, updateInstance, getInstanceForDate } = useEventInstances();
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

  const handleEventClick = (event: FamilyEvent, date?: Date) => {
    if (date) {
      // Show context menu to choose between editing instance or series
      setSelectedEvent(event);
      setSelectedDate(date);
      const instance = getInstanceForDate(event.id, date);
      setSelectedInstance(instance);
      setInstanceDialogOpen(true);
    } else {
      // Edit the whole series
      setSelectedEvent(event);
      setEventDialogOpen(true);
    }
  };

  const handleEditSeries = () => {
    setInstanceDialogOpen(false);
    setEventDialogOpen(true);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedEvent) {
      deleteEventsByTitle(selectedEvent.title);
      toast({
        title: "Events Deleted",
        description: `All events named "${selectedEvent.title}" have been deleted.`,
      });
      setBulkDeleteDialogOpen(false);
      setInstanceDialogOpen(false);
      setEventDialogOpen(false);
    }
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

  const handleSaveInstance = (instance: EventInstance) => {
    const existingInstance = getInstanceForDate(instance.eventId, instance.date);
    if (existingInstance) {
      updateInstance(existingInstance.id, instance);
      toast({
        title: "Instance Updated",
        description: "Event details for this date have been updated.",
      });
    } else {
      addInstance(instance);
      toast({
        title: "Instance Created",
        description: "Custom details saved for this date.",
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

        {selectedEvent && selectedDate && (
          <InstanceDialog
            open={instanceDialogOpen}
            onOpenChange={setInstanceDialogOpen}
            onSave={handleSaveInstance}
            onEditSeries={handleEditSeries}
            onDeleteAll={handleBulkDelete}
            eventId={selectedEvent.id}
            eventTitle={selectedEvent.title}
            date={selectedDate}
            instance={selectedInstance}
            defaultTransportation={selectedEvent.transportation}
          />
        )}

        {selectedEvent && (
          <BulkDeleteDialog
            open={bulkDeleteDialogOpen}
            onOpenChange={setBulkDeleteDialogOpen}
            onConfirm={handleConfirmBulkDelete}
            eventTitle={selectedEvent.title}
            eventCount={events.filter(e => e.title === selectedEvent.title).length}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
