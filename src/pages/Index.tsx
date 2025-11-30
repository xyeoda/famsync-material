import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { WeekView } from "@/components/Calendar/WeekView";
import { MonthView } from "@/components/Calendar/MonthView";
import { EventDialog } from "@/components/Calendar/EventDialog";
import { InstanceDialog } from "@/components/Calendar/InstanceDialog";
import { BulkDeleteDialog } from "@/components/Calendar/BulkDeleteDialog";
import { UserRoleBadge } from "@/components/UserRoleBadge";
import { useEventsDB } from "@/hooks/useEventsDB";
import { useEventInstancesDB } from "@/hooks/useEventInstancesDB";
import { FamilyEvent, EventInstance } from "@/types/event";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useAuth } from "@/hooks/useAuth";
import dashboardBg from "@/assets/dashboard-bg.png";
import { v4 as uuidv4 } from "uuid";

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedInstance, setSelectedInstance] = useState<EventInstance | undefined>(undefined);
  const { householdId, canEdit, loading: householdLoading, userRole } = useHousehold();
  const { user } = useAuth();
  const location = useLocation();
  const { events, addEvent, updateEvent, deleteEventsByTitle, loadEvents, loading: eventsLoading } = useEventsDB();
  const { instances, addInstance, updateInstance, deleteInstance, getInstanceForDate, loadInstances, loading: instancesLoading } = useEventInstancesDB();
  const { toast } = useToast();

  // Load data when household ID is available
  useEffect(() => {
    if (householdId) {
      loadEvents(householdId);
      loadInstances(householdId);
    }
  }, [householdId]);

  // Check if we should open the event dialog from navigation state
  useEffect(() => {
    const state = location.state as { openEventDialog?: boolean } | null;
    if (state?.openEventDialog && canEdit) {
      setEventDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, canEdit]);

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
    if (!canEdit) return;
    setSelectedEvent(undefined);
    setEventDialogOpen(true);
  };

  const handleEventClick = (event: FamilyEvent, date?: Date) => {
    if (!canEdit) return; // Don't allow editing in display mode
    
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
    if (!householdId) return;
    
    if (selectedEvent) {
      updateEvent(event.id, event);
      toast({
        title: "Event Updated",
        description: `${event.title} has been updated successfully.`,
      });
    } else {
      addEvent(event, householdId);
      toast({
        title: "Event Created",
        description: `${event.title} has been added to your schedule.`,
      });
    }
  };

  const handleSaveInstance = (instance: EventInstance) => {
    if (!householdId) return;
    
    const existingInstance = getInstanceForDate(instance.eventId, instance.date);
    if (existingInstance) {
      updateInstance(existingInstance.id, instance);
      toast({
        title: "Instance Updated",
        description: "Event details for this date have been updated.",
      });
    } else {
      addInstance(instance, householdId);
      toast({
        title: "Instance Created",
        description: "Custom details saved for this date.",
      });
    }
  };

  const handleDeleteInstance = () => {
    if (!householdId || !selectedEvent || !selectedDate) return;
    
    if (selectedInstance) {
      // If instance exists, delete it
      deleteInstance(selectedInstance.id);
      toast({
        title: "Instance Cancelled",
        description: "This occurrence has been cancelled and removed.",
      });
    } else {
      // If no instance exists, create a cancelled instance
      const now = new Date();
      const cancelledInstance: EventInstance = {
        id: uuidv4(),
        eventId: selectedEvent.id,
        date: selectedDate,
        cancelled: true,
        createdAt: now,
        updatedAt: now,
      };
      addInstance(cancelledInstance, householdId);
      toast({
        title: "Instance Cancelled",
        description: "This occurrence has been marked as cancelled.",
      });
    }
    setInstanceDialogOpen(false);
  };

  if (householdLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-15 pointer-events-none"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="mx-auto max-w-[1800px] relative z-10">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
          onToday={handleToday}
          onNewEvent={handleNewEvent}
          canEdit={canEdit}
          userRole={userRole}
          user={user}
        />

        {view === "week" ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            instances={instances}
            onEventClick={handleEventClick}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            events={events}
            instances={instances}
            onEventClick={handleEventClick}
          />
        )}

        <EventDialog
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          onSave={handleSaveEvent}
          event={selectedEvent}
        />

        {selectedEvent && selectedDate && (() => {
          const clickedDayOfWeek = selectedDate.getDay();
          const matchingSlot = selectedEvent.recurrenceSlots.find(slot => slot.dayOfWeek === clickedDayOfWeek);
          
          return (
            <InstanceDialog
              open={instanceDialogOpen}
              onOpenChange={setInstanceDialogOpen}
              onSave={handleSaveInstance}
              onEditSeries={handleEditSeries}
              onDeleteAll={handleBulkDelete}
              onDeleteInstance={handleDeleteInstance}
              event={selectedEvent}
              date={selectedDate}
              slotDayOfWeek={matchingSlot?.dayOfWeek}
              slotTransportation={matchingSlot?.transportation}
              instance={selectedInstance}
            />
          );
        })()}

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
