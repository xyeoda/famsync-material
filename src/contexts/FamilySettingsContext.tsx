import { createContext, useContext, ReactNode } from "react";
import { useFamilySettingsDB } from "@/hooks/useFamilySettingsDB";
import { FamilyMember } from "@/types/event";

interface FamilySettingsContextType {
  getFamilyMemberName: (member: FamilyMember) => string;
  getFamilyMembers: () => Record<FamilyMember, string>;
}

const FamilySettingsContext = createContext<FamilySettingsContextType | undefined>(undefined);

export function FamilySettingsProvider({ children }: { children: ReactNode }) {
  const { getFamilyMemberName, getFamilyMembers } = useFamilySettingsDB();

  return (
    <FamilySettingsContext.Provider value={{ getFamilyMemberName, getFamilyMembers }}>
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
