import { FamilyMember, MemberType, DEFAULT_COLORS } from "@/types/family";

const STORAGE_KEY = "family-members";

class FamilyStore {
  private members: FamilyMember[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.members = parsed.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }));
      }
    } catch (error) {
      console.error("Error loading family members:", error);
      this.members = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.members));
    } catch (error) {
      console.error("Error saving family members:", error);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getMembers(): FamilyMember[] {
    return [...this.members];
  }

  getMembersByType(type: MemberType): FamilyMember[] {
    return this.members.filter((m) => m.type === type);
  }

  getMemberById(id: string): FamilyMember | undefined {
    return this.members.find((m) => m.id === id);
  }

  addMember(member: Omit<FamilyMember, "id" | "createdAt">): FamilyMember {
    const usedColors = this.members.map(m => m.color);
    const availableColor = DEFAULT_COLORS.find(c => !usedColors.includes(c)) || DEFAULT_COLORS[0];
    
    const newMember: FamilyMember = {
      ...member,
      id: crypto.randomUUID(),
      color: member.color || availableColor,
      createdAt: new Date(),
    };
    this.members.push(newMember);
    this.saveToStorage();
    this.notify();
    return newMember;
  }

  updateMember(id: string, updates: Partial<FamilyMember>): void {
    const index = this.members.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.members[index] = { ...this.members[index], ...updates };
      this.saveToStorage();
      this.notify();
    }
  }

  deleteMember(id: string): void {
    this.members = this.members.filter((m) => m.id !== id);
    this.saveToStorage();
    this.notify();
  }

  getDrivers(): FamilyMember[] {
    return this.members.filter((m) => m.canDrive);
  }

  getKids(): FamilyMember[] {
    return this.members.filter((m) => m.type === "kid");
  }
}

export const familyStore = new FamilyStore();
