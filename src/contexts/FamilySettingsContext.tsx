import { createContext, useContext, ReactNode, useEffect } from "react";
import { useFamilySettingsDB, FamilySettings } from "@/hooks/useFamilySettingsDB";
import { useHousehold } from "./HouseholdContext";
import { FamilyMember, isLegacyMemberId } from "@/types/event";

interface FamilySettingsContextType {
  getFamilyMemberName: (member: string) => string;
  getFamilyMembers: () => Record<FamilyMember, string>;
  settings: FamilySettings;
}

const FamilySettingsContext = createContext<FamilySettingsContextType | undefined>(undefined);

export function FamilySettingsProvider({ children }: { children: ReactNode }) {
  const { getFamilyMemberName: getLegacyMemberName, getFamilyMembers, loadSettings, settings } = useFamilySettingsDB();
  const { householdId } = useHousehold();

  useEffect(() => {
    if (householdId) {
      loadSettings(householdId);
    }
  }, [householdId]);

  // Enhanced getFamilyMemberName that handles both legacy IDs and UUIDs
  const getFamilyMemberName = (member: string): string => {
    // If it's a legacy ID, use the legacy function
    if (isLegacyMemberId(member)) {
      return getLegacyMemberName(member as FamilyMember);
    }
    // For UUIDs, return the ID - the calling component should use FamilyMembersContext instead
    return member;
  };

  return (
    <FamilySettingsContext.Provider value={{ getFamilyMemberName, getFamilyMembers, settings }}>
      {children}
    </FamilySettingsContext.Provider>
  );
}

export function useFamilySettingsContext() {
  const context = useContext(FamilySettingsContext);
  if (!context) {
    throw new Error("useFamilySettingsContext must be used within FamilySettingsProvider");
  }
  return context;
}
