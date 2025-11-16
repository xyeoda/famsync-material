import { FamilyEvent } from "@/types/event";
import { addDays } from "date-fns";

// Sample events to populate the calendar
export const sampleEvents: FamilyEvent[] = [
  {
    id: "1",
    title: "BJJ Training",
    description: "Brazilian Jiu-Jitsu practice",
    category: "sports",
    recurrenceSlots: [
      { dayOfWeek: 1, startTime: "16:00", endTime: "18:00" }, // Monday 4-6pm
      { dayOfWeek: 3, startTime: "17:00", endTime: "18:00" }, // Wednesday 5-6pm
      { dayOfWeek: 5, startTime: "12:00", endTime: "13:00" }, // Friday 12-1pm
    ],
    participants: [
      { member: "kid1", roles: [] },
      { member: "parent1", roles: ["driver", "returns"] },
    ],
    startDate: new Date(),
    location: "Elite BJJ Academy",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Piano Lessons",
    description: "Weekly piano practice",
    category: "education",
    recurrenceSlots: [
      { dayOfWeek: 2, startTime: "15:30", endTime: "16:30" }, // Tuesday
      { dayOfWeek: 4, startTime: "15:30", endTime: "16:30" }, // Thursday
    ],
    participants: [
      { member: "kid2", roles: [] },
      { member: "parent2", roles: ["driver", "accompanies"] },
    ],
    startDate: new Date(),
    location: "Music School Downtown",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Soccer Practice",
    description: "Team practice session",
    category: "sports",
    recurrenceSlots: [
      { dayOfWeek: 2, startTime: "17:00", endTime: "18:30" }, // Tuesday
      { dayOfWeek: 4, startTime: "17:00", endTime: "18:30" }, // Thursday
    ],
    participants: [
      { member: "kid1", roles: [] },
      { member: "kid2", roles: [] },
      { member: "parent1", roles: ["driver"] },
      { member: "parent2", roles: ["returns"] },
    ],
    startDate: new Date(),
    location: "Community Sports Complex",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "House Cleaning",
    description: "Weekly deep clean",
    category: "chores",
    recurrenceSlots: [
      { dayOfWeek: 3, startTime: "09:00", endTime: "12:00" }, // Wednesday morning
    ],
    participants: [
      { member: "housekeeper", roles: [] },
    ],
    startDate: new Date(),
    location: "Home",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    title: "Family Game Night",
    description: "Board games and quality time",
    category: "social",
    recurrenceSlots: [
      { dayOfWeek: 6, startTime: "19:00", endTime: "21:00" }, // Saturday evening
    ],
    participants: [
      { member: "parent1", roles: [] },
      { member: "parent2", roles: [] },
      { member: "kid1", roles: [] },
      { member: "kid2", roles: [] },
    ],
    startDate: new Date(),
    location: "Home",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    title: "Dentist Appointment",
    description: "Regular checkup",
    category: "health",
    recurrenceSlots: [
      { dayOfWeek: 1, startTime: "14:00", endTime: "15:00" }, // Monday
    ],
    participants: [
      { member: "kid1", roles: [] },
      { member: "parent2", roles: ["driver", "accompanies"] },
    ],
    startDate: addDays(new Date(), 7),
    endDate: addDays(new Date(), 7),
    location: "Smile Dental Care",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
