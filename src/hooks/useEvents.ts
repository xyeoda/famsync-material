import { useState, useEffect } from "react";
import { FamilyEvent } from "@/types/event";
import { eventStore } from "@/lib/eventStore";

export function useEvents() {
  const [events, setEvents] = useState<FamilyEvent[]>([]);

  useEffect(() => {
    setEvents(eventStore.getEvents());
    
    const unsubscribe = eventStore.subscribe(() => {
      setEvents(eventStore.getEvents());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    events,
    addEvent: (event: FamilyEvent) => eventStore.addEvent(event),
    updateEvent: (id: string, updates: Partial<FamilyEvent>) => eventStore.updateEvent(id, updates),
    deleteEvent: (id: string) => eventStore.deleteEvent(id),
    deleteEventsByTitle: (title: string) => eventStore.deleteEventsByTitle(title),
    getEventById: (id: string) => eventStore.getEventById(id),
  };
}
