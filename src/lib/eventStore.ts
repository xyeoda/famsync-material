import { FamilyEvent } from "@/types/event";

// Simple in-memory store for now - will be replaced with proper database
class EventStore {
  private events: FamilyEvent[] = [];
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
}

export const eventStore = new EventStore();
