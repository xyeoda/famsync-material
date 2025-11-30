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
  parent1Color: string; // HSL format
  parent2Color: string; // HSL format
  housekeeperColor: string; // HSL format
}

const DEFAULT_SETTINGS: FamilySettings = {
  parent1Name: "Shawn",
  parent2Name: "Wynne",
  kid1Name: "Vince",
  kid2Name: "Maeve",
  housekeeperName: "Nuru",
  kid1Color: "266 100% 60%", // Purple
  kid2Color: "39 100% 50%", // Gold
  parent1Color: "205 85% 55%", // Deep Sky Blue
  parent2Color: "350 75% 60%", // Coral Rose
  housekeeperColor: "168 55% 45%", // Jade Teal
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
    document.documentElement.style.setProperty('--parent1-color', settings.parent1Color);
    document.documentElement.style.setProperty('--parent2-color', settings.parent2Color);
    document.documentElement.style.setProperty('--housekeeper-color', settings.housekeeperColor);
  }, [settings.kid1Color, settings.kid2Color, settings.parent1Color, settings.parent2Color, settings.housekeeperColor]);

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
