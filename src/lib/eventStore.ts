import { FamilyEvent, EventInstance } from "@/types/event";

// Simple in-memory store for now - will be replaced with proper database
class EventStore {
  private events: FamilyEvent[] = [];
  private instances: EventInstance[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getEvents(): FamilyEvent[] {
    return [...this.events];
  }

  getEventById(id: string): FamilyEvent | undefined {
    return this.events.find(event => event.id === id);
  }

  addEvent(event: FamilyEvent): void {
    this.events.push(event);
    this.notify();
  }

  updateEvent(id: string, updates: Partial<FamilyEvent>): void {
    const index = this.events.findIndex(event => event.id === id);
    if (index !== -1) {
      this.events[index] = {
        ...this.events[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.notify();
    }
  }

  deleteEvent(id: string): void {
    this.events = this.events.filter(event => event.id !== id);
    this.notify();
  }

  // Get events for a specific date range
  getEventsInRange(startDate: Date, endDate: Date): FamilyEvent[] {
    return this.events.filter(event => {
      if (event.endDate && event.endDate < startDate) return false;
      if (event.startDate > endDate) return false;
      return true;
    });
  }

  // Event instance management
  getInstances(): EventInstance[] {
    return [...this.instances];
  }

  getInstanceForDate(eventId: string, date: Date): EventInstance | undefined {
    const dateStr = date.toISOString().split('T')[0];
    return this.instances.find(instance => {
      const instanceDateStr = instance.date.toISOString().split('T')[0];
      return instance.eventId === eventId && instanceDateStr === dateStr;
    });
  }

  addInstance(instance: EventInstance): void {
    this.instances.push(instance);
    this.notify();
  }

  updateInstance(id: string, updates: Partial<EventInstance>): void {
    const index = this.instances.findIndex(instance => instance.id === id);
    if (index !== -1) {
      this.instances[index] = {
        ...this.instances[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.notify();
    }
  }

  deleteInstance(id: string): void {
    this.instances = this.instances.filter(instance => instance.id !== id);
    this.notify();
  }

  // Bulk delete by event title
  deleteEventsByTitle(title: string): void {
    const eventsToDelete = this.events.filter(event => event.title === title);
    const eventIds = eventsToDelete.map(e => e.id);
    
    this.events = this.events.filter(event => event.title !== title);
    this.instances = this.instances.filter(instance => !eventIds.includes(instance.eventId));
    this.notify();
  }
}

export const eventStore = new EventStore();
