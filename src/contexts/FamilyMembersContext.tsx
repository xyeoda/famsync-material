import { createContext, useContext, ReactNode, useEffect } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useHousehold } from "./HouseholdContext";
import { FamilyMemberRecord, MemberType, HelperCategory } from "@/types/familyMember";

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

  const getMemberName = (id: string): string => {
    const member = getMemberById(id);
    return member?.name || 'Unknown';
  };

  const getMemberColor = (id: string): string => {
    const member = getMemberById(id);
    return member?.color || '217 91% 60%';
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
