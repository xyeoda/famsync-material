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
    participants: ["kid1"],
    transportation: {
      dropOffPerson: "parent1",
      dropOffMethod: "car",
      pickUpPerson: "parent1",
      pickUpMethod: "car",
    },
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
    participants: ["kid2"],
    transportation: {
      dropOffPerson: "parent2",
      dropOffMethod: "car",
      pickUpPerson: "parent2",
      pickUpMethod: "car",
    },
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
    participants: ["kid1", "kid2"],
    transportation: {
      dropOffPerson: "parent1",
      dropOffMethod: "car",
      pickUpPerson: "parent2",
      pickUpMethod: "car",
    },
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
    participants: [],
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
    participants: ["kid1", "kid2"],
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
    participants: ["kid1"],
    transportation: {
      dropOffPerson: "parent2",
      dropOffMethod: "car",
      pickUpPerson: "parent2",
      pickUpMethod: "car",
    },
    startDate: addDays(new Date(), 7),
    endDate: addDays(new Date(), 7),
    location: "Smile Dental Care",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
