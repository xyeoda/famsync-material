import { familyStore } from "./familyStore";

export function initializeFamilyData() {
  const existingMembers = familyStore.getMembers();
  
  // Only initialize if no members exist
  if (existingMembers.length === 0) {
    // Add sample family members
    familyStore.addMember({
      name: "Parent 1",
      type: "parent",
      canDrive: true,
      age: 35,
      color: "266 100% 60%", // Purple
    });

    familyStore.addMember({
      name: "Parent 2",
      type: "parent",
      canDrive: true,
      age: 33,
      color: "39 100% 50%", // Orange
    });

    familyStore.addMember({
      name: "Kid 1",
      type: "kid",
      canDrive: false,
      age: 8,
      color: "217 91% 60%", // Blue
    });

    familyStore.addMember({
      name: "Kid 2",
      type: "kid",
      canDrive: false,
      age: 6,
      color: "142 71% 45%", // Green
    });

    familyStore.addMember({
      name: "Housekeeper",
      type: "helper",
      canDrive: true,
      age: 28,
      color: "280 67% 56%", // Pink
    });
  }
}
