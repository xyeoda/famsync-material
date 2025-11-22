import { FamilyEvent, EventInstance, FamilyMember } from "@/types/event";

// Migration helper to convert old participant format to new format
function migrateParticipants(participants: any[]): FamilyMember[] {
  if (!participants || participants.length === 0) return [];
  
  // If already in new format (array of strings), filter for kids only
  if (typeof participants[0] === 'string') {
    return participants.filter((p: FamilyMember) => p === 'kid1' || p === 'kid2');
  }
  
  // If in old format (array of objects with member and roles), convert
  return participants
    .map((p: any) => p.member as FamilyMember)
    .filter((m: FamilyMember) => m === 'kid1' || m === 'kid2');
}

// Store with localStorage persistence
class EventStore {
  private events: FamilyEvent[] = [];
  private instances: EventInstance[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedEvents = localStorage.getItem('family-events');
      const storedInstances = localStorage.getItem('family-event-instances');
      
      if (storedEvents) {
        this.events = JSON.parse(storedEvents, (key, value) => {
          if (key === 'startDate' || key === 'endDate' || key === 'createdAt' || key === 'updatedAt' || key === 'date') {
            return value ? new Date(value) : value;
          }
          return value;
        });
      }
      
      if (storedInstances) {
        this.instances = JSON.parse(storedInstances, (key, value) => {
          if (key === 'date' || key === 'createdAt' || key === 'updatedAt') {
            return value ? new Date(value) : value;
          }
          return value;
        });
      }
    } catch (error) {
      console.error('Failed to load events from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('family-events', JSON.stringify(this.events));
      localStorage.setItem('family-event-instances', JSON.stringify(this.instances));
    } catch (error) {
      console.error('Failed to save events to storage:', error);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach(listener => listener());
  }

  getEvents(): FamilyEvent[] {
    // Migrate participants on read
    return this.events.map(event => ({
      ...event,
      participants: migrateParticipants(event.participants as any)
    }));
  }

  getEventById(id: string): FamilyEvent | undefined {
    const event = this.events.find(event => event.id === id);
    if (!event) return undefined;
    
    // Migrate participants on read
    return {
      ...event,
      participants: migrateParticipants(event.participants as any)
    };
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
