export type MemberType = "parent" | "kid" | "helper";

export interface FamilyMember {
  id: string;
  name: string;
  nickname?: string;
  type: MemberType;
  canDrive: boolean;
  age?: number;
  color?: string; // For visual identification
  createdAt: Date;
}

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  parent: "Parent",
  kid: "Child",
  helper: "Helper",
};

export const DEFAULT_COLORS = [
  "266 100% 60%", // Purple
  "39 100% 50%",  // Orange
  "217 91% 60%",  // Blue
  "142 71% 45%",  // Green
  "0 72% 51%",    // Red
  "280 67% 56%",  // Pink
  "198 93% 60%",  // Cyan
  "48 96% 53%",   // Yellow
];
