import { createContext, useContext, ReactNode, useEffect } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useHousehold } from "./HouseholdContext";
import { FamilyMemberRecord, MemberType, HelperCategory } from "@/types/familyMember";
import { isLegacyMemberId } from "@/types/event";

interface FamilyMembersContextType {
  members: FamilyMemberRecord[];
  loading: boolean;
  error: string | null;
  addMember: (member: Omit<FamilyMemberRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FamilyMemberRecord | null>;
  updateMember: (id: string, updates: Partial<FamilyMemberRecord>) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;
  reorderMembers: (memberIds: string[]) => Promise<boolean>;
  getMembersByType: (type: MemberType) => FamilyMemberRecord[];
  getMemberById: (id: string) => FamilyMemberRecord | undefined;
  getMemberName: (id: string) => string;
  getMemberColor: (id: string) => string;
  getKids: () => FamilyMemberRecord[];
  getAdults: () => FamilyMemberRecord[];
  getNextColor: (memberType: MemberType) => string;
  refresh: () => Promise<void>;
  // Helper to get member by legacy ID (parent1, kid1, etc.)
  getMemberByLegacyId: (legacyId: string) => FamilyMemberRecord | undefined;
  // Helper to get member display name - handles both UUID and legacy IDs
  getDisplayName: (id: string) => string;
}

const FamilyMembersContext = createContext<FamilyMembersContextType | undefined>(undefined);

export function FamilyMembersProvider({ children }: { children: ReactNode }) {
  const { householdId } = useHousehold();
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    reorderMembers,
    getMembersByType,
    getMemberById,
    getKids,
    getAdults,
    getNextColor,
    refresh,
  } = useFamilyMembers(householdId);

  // Apply member colors as CSS custom properties
  useEffect(() => {
    const kids = members.filter(m => m.memberType === 'kid' && m.isActive);
    kids.forEach((kid, index) => {
      document.documentElement.style.setProperty(`--kid${index + 1}-color`, kid.color);
    });

    const parents = members.filter(m => m.memberType === 'parent' && m.isActive);
    parents.forEach((parent, index) => {
      document.documentElement.style.setProperty(`--parent${index + 1}-color`, parent.color);
    });

    // Set first helper color for backwards compatibility
    const helpers = members.filter(m => m.memberType === 'helper' && m.isActive);
    if (helpers.length > 0) {
      document.documentElement.style.setProperty('--housekeeper-color', helpers[0].color);
    }
  }, [members]);

  // Get member by legacy ID (parent1, parent2, kid1, kid2, housekeeper)
  const getMemberByLegacyId = (legacyId: string): FamilyMemberRecord | undefined => {
    if (legacyId === 'parent1') {
      const parents = members.filter(m => m.memberType === 'parent' && m.isActive);
      return parents[0];
    }
    if (legacyId === 'parent2') {
      const parents = members.filter(m => m.memberType === 'parent' && m.isActive);
      return parents[1];
    }
    if (legacyId === 'kid1') {
      const kids = members.filter(m => m.memberType === 'kid' && m.isActive);
      return kids[0];
    }
    if (legacyId === 'kid2') {
      const kids = members.filter(m => m.memberType === 'kid' && m.isActive);
      return kids[1];
    }
    if (legacyId === 'housekeeper') {
      const helpers = members.filter(m => m.memberType === 'helper' && m.isActive);
      return helpers[0];
    }
    return undefined;
  };

  const getMemberName = (id: string): string => {
    // First check if it's a legacy ID
    if (isLegacyMemberId(id)) {
      const member = getMemberByLegacyId(id);
      return member?.name || id;
    }
    // Otherwise look up by UUID
    const member = getMemberById(id);
    return member?.name || 'Unknown';
  };

  const getMemberColor = (id: string): string => {
    // First check if it's a legacy ID
    if (isLegacyMemberId(id)) {
      const member = getMemberByLegacyId(id);
      return member?.color || '217 91% 60%';
    }
    // Otherwise look up by UUID
    const member = getMemberById(id);
    return member?.color || '217 91% 60%';
  };

  // Get display name - handles both UUID and legacy IDs
  const getDisplayName = (id: string): string => {
    return getMemberName(id);
  };

  return (
    <FamilyMembersContext.Provider value={{
      members,
      loading,
      error,
      addMember,
      updateMember,
      deleteMember,
      reorderMembers,
      getMembersByType,
      getMemberById,
      getMemberName,
      getMemberColor,
      getKids,
      getAdults,
      getNextColor,
      refresh,
      getMemberByLegacyId,
      getDisplayName,
    }}>
      {children}
    </FamilyMembersContext.Provider>
  );
}

export function useFamilyMembersContext() {
  const context = useContext(FamilyMembersContext);
  if (!context) {
    throw new Error("useFamilyMembersContext must be used within FamilyMembersProvider");
  }
  return context;
}
