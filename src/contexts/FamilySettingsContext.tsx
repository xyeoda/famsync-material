import { createContext, useContext, ReactNode, useEffect } from "react";
import { useFamilySettingsDB, FamilySettings } from "@/hooks/useFamilySettingsDB";
import { useHousehold } from "./HouseholdContext";
import { FamilyMember } from "@/types/event";

interface FamilySettingsContextType {
  getFamilyMemberName: (member: FamilyMember) => string;
  getFamilyMembers: () => Record<FamilyMember, string>;
  settings: FamilySettings;
}

const FamilySettingsContext = createContext<FamilySettingsContextType | undefined>(undefined);

export function FamilySettingsProvider({ children }: { children: ReactNode }) {
  const { getFamilyMemberName, getFamilyMembers, loadSettings, settings } = useFamilySettingsDB();
  const { householdId } = useHousehold();

  useEffect(() => {
    if (householdId) {
      loadSettings(householdId);
    }
  }, [householdId]);

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
