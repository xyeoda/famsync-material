import { useState, useEffect } from "react";
import { FamilyMember } from "@/types/event";

export interface FamilySettings {
  parent1Name: string;
  parent2Name: string;
  kid1Name: string;
  kid2Name: string;
  housekeeperName: string;
  kid1Color: string; // HSL format: "266 100% 60%"
  kid2Color: string; // HSL format: "39 100% 50%"
}

const DEFAULT_SETTINGS: FamilySettings = {
  parent1Name: "Parent 1",
  parent2Name: "Parent 2",
  kid1Name: "Kid 1",
  kid2Name: "Kid 2",
  housekeeperName: "Housekeeper",
  kid1Color: "266 100% 60%", // Purple
  kid2Color: "39 100% 50%", // Orange
};

const STORAGE_KEY = "family-settings";

export function useFamilySettings() {
  const [settings, setSettings] = useState<FamilySettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedSettings = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    // Migrate old settings without colors
    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply colors to CSS custom properties
  useEffect(() => {
    document.documentElement.style.setProperty('--kid1-color', settings.kid1Color);
    document.documentElement.style.setProperty('--kid2-color', settings.kid2Color);
  }, [settings.kid1Color, settings.kid2Color]);

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
