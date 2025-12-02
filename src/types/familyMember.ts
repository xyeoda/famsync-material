// Dynamic family member types - replaces hardcoded FamilyMember type

export type MemberType = 'parent' | 'kid' | 'helper';

export type HelperCategory = 'grandparent' | 'nanny' | 'housekeeper' | 'babysitter' | 'au_pair' | 'other';

export const HELPER_CATEGORIES: Record<HelperCategory, string> = {
  grandparent: 'Grandparent',
  nanny: 'Nanny',
  housekeeper: 'Housekeeper',
  babysitter: 'Babysitter',
  au_pair: 'Au Pair',
  other: 'Other',
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  parent: 'Parent',
  kid: 'Kid',
  helper: 'Helper',
};

export interface FamilyMemberRecord {
  id: string;
  householdId: string;
  name: string;
  color: string; // HSL format
  memberType: MemberType;
  helperCategory?: HelperCategory;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default colors for new members
export const DEFAULT_MEMBER_COLORS: Record<MemberType, string[]> = {
  parent: [
    '205 85% 55%',  // Blue
    '350 75% 60%',  // Pink/Rose
    '160 60% 45%',  // Teal
    '280 60% 55%',  // Purple
  ],
  kid: [
    '266 100% 60%', // Purple
    '39 100% 50%',  // Orange/Gold
    '180 70% 45%',  // Cyan
    '330 80% 55%',  // Magenta
    '120 60% 45%',  // Green
  ],
  helper: [
    '168 55% 45%',  // Teal
    '30 70% 50%',   // Orange
    '200 60% 50%',  // Sky Blue
    '290 50% 55%',  // Violet
  ],
};
