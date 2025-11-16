import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FamilyEvent } from "@/types/event";
import { isSameDay, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRecurringDates(
  event: FamilyEvent,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  const eventEndDate = event.endDate ? new Date(event.endDate) : endDate;
  const eventStartDate = new Date(event.startDate);

  while (currentDate <= endDate && currentDate <= eventEndDate) {
    if (currentDate >= eventStartDate) {
      const dayOfWeek = currentDate.getDay();
      const hasSlotForDay = event.recurrenceSlots.some(slot => slot.dayOfWeek === dayOfWeek);
      
      if (hasSlotForDay) {
        dates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
