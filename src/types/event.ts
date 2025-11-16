export type FamilyMember = "parent1" | "parent2" | "kid1" | "kid2" | "housekeeper";

export type EventRole = "driver" | "accompanies" | "returns";

export type TransportMethod = "car" | "bus" | "walk" | "bike";

export type ActivityCategory = "sports" | "education" | "social" | "chores" | "health" | "other";

export interface RecurrenceSlot {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface EventParticipant {
  member: FamilyMember;
  roles: EventRole[];
}

export interface TransportationDetails {
  dropOffMethod?: TransportMethod;
  dropOffPerson?: FamilyMember;
  pickUpMethod?: TransportMethod;
  pickUpPerson?: FamilyMember;
}

export interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  recurrenceSlots: RecurrenceSlot[]; // Multiple time slots per week
  participants: EventParticipant[];
  transportation?: TransportationDetails;
  startDate: Date; // When the recurring pattern starts
  endDate?: Date; // Optional end date for the pattern
  location?: string;
  notes?: string;
  color?: string; // Optional custom color override
  createdAt: Date;
  updatedAt: Date;
}

export const FAMILY_MEMBERS: Record<FamilyMember, string> = {
  parent1: "Parent 1",
  parent2: "Parent 2",
  kid1: "Kid 1",
  kid2: "Kid 2",
  housekeeper: "Housekeeper",
};

export const EVENT_ROLES: Record<EventRole, string> = {
  driver: "Driver",
  accompanies: "Accompanies",
  returns: "Returns",
};

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; icon: string }> = {
  sports: { label: "Sports", icon: "⚽" },
  education: { label: "Education", icon: "📚" },
  social: { label: "Social", icon: "🎉" },
  chores: { label: "Chores", icon: "🧹" },
  health: { label: "Health", icon: "❤️" },
  other: { label: "Other", icon: "📌" },
};

export const EVENT_CATEGORIES: ActivityCategory[] = [
  "sports",
  "education",
  "social",
  "chores",
  "health",
  "other",
];
