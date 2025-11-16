import { useState, useEffect } from "react";
import { FamilyMember } from "@/types/event";

export interface FamilySettings {
  parent1Name: string;
  parent2Name: string;
  kid1Name: string;
  kid2Name: string;
  housekeeperName: string;
}

const DEFAULT_SETTINGS: FamilySettings = {
  parent1Name: "Parent 1",
  parent2Name: "Parent 2",
  kid1Name: "Kid 1",
  kid2Name: "Kid 2",
  housekeeperName: "Housekeeper",
};

const STORAGE_KEY = "family-settings";

export function useFamilySettings() {
  const [settings, setSettings] = useState<FamilySettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<FamilySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const getFamilyMemberName = (member: FamilyMember): string => {
    const nameMap: Record<FamilyMember, keyof FamilySettings> = {
      parent1: "parent1Name",
      parent2: "parent2Name",
      kid1: "kid1Name",
      kid2: "kid2Name",
      housekeeper: "housekeeperName",
    };
    return settings[nameMap[member]];
  };

  const getFamilyMembers = (): Record<FamilyMember, string> => ({
    parent1: settings.parent1Name,
    parent2: settings.parent2Name,
    kid1: settings.kid1Name,
    kid2: settings.kid2Name,
    housekeeper: settings.housekeeperName,
  });

  return {
    settings,
    updateSettings,
    resetSettings,
    getFamilyMemberName,
    getFamilyMembers,
  };
}
