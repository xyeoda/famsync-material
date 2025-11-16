import { useState, useEffect } from "react";
import { EventInstance } from "@/types/event";
import { eventStore } from "@/lib/eventStore";

export function useEventInstances() {
  const [instances, setInstances] = useState<EventInstance[]>([]);

  useEffect(() => {
    setInstances(eventStore.getInstances());
    
    const unsubscribe = eventStore.subscribe(() => {
      setInstances(eventStore.getInstances());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    instances,
    getInstanceForDate: (eventId: string, date: Date) => eventStore.getInstanceForDate(eventId, date),
    addInstance: (instance: EventInstance) => eventStore.addInstance(instance),
    updateInstance: (id: string, updates: Partial<EventInstance>) => eventStore.updateInstance(id, updates),
    deleteInstance: (id: string) => eventStore.deleteInstance(id),
  };
}
