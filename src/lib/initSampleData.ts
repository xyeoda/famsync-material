import { eventStore } from "./eventStore";
import { sampleEvents } from "./sampleData";

// Initialize store with sample data
export function initializeSampleData() {
  // Disabled - users will create events manually
  // if (eventStore.getEvents().length === 0) {
  //   sampleEvents.forEach(event => {
  //     eventStore.addEvent(event);
  //   });
  // }
}
