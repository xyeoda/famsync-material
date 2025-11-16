import { eventStore } from "./eventStore";
import { sampleEvents } from "./sampleData";

// Initialize store with sample data
export function initializeSampleData() {
  // Only add sample data if store is empty
  if (eventStore.getEvents().length === 0) {
    sampleEvents.forEach(event => {
      eventStore.addEvent(event);
    });
  }
}
