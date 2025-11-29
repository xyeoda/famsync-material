import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { FamilyMember } from "@/types/event";
import { useAuth } from "./useAuth";

export interface FamilySettings {
  parent1Name: string;
  parent2Name: string;
  kid1Name: string;
  kid2Name: string;
  housekeeperName: string;
  kid1Color: string;
  kid2Color: string;
  parent1Color: string;
  parent2Color: string;
  housekeeperColor: string;
}

const DEFAULT_SETTINGS: FamilySettings = {
  parent1Name: "Shawn",
  parent2Name: "Wynne",
  kid1Name: "Vince",
  kid2Name: "Maeve",
  housekeeperName: "Nuru",
  kid1Color: "266 100% 60%",
  kid2Color: "39 100% 50%",
  parent1Color: "217 71% 58%",
  parent2Color: "340 65% 55%",
  housekeeperColor: "180 50% 45%",
};

export function useFamilySettingsDB() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FamilySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user]);

  useEffect(() => {
    document.documentElement.style.setProperty('--kid1-color', settings.kid1Color);
    document.documentElement.style.setProperty('--kid2-color', settings.kid2Color);
    document.documentElement.style.setProperty('--parent1-color', settings.parent1Color);
    document.documentElement.style.setProperty('--parent2-color', settings.parent2Color);
    document.documentElement.style.setProperty('--housekeeper-color', settings.housekeeperColor);
  }, [settings]);

  const loadSettings = async (forceHouseholdId?: string) => {
    try {
      let query = supabase.from('family_settings').select('*');
      
      // If we have a specific household ID to load (display mode)
      if (forceHouseholdId) {
        query = query.eq('household_id', forceHouseholdId);
      } else if (user) {
        // Otherwise load by user_id (authenticated mode)
        query = query.eq('user_id', user.id);
      } else {
        // No user and no household ID, can't load settings
        return;
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          parent1Name: data.parent1_name,
          parent2Name: data.parent2_name,
          kid1Name: data.kid1_name,
          kid2Name: data.kid2_name,
          housekeeperName: data.housekeeper_name,
          kid1Color: data.kid1_color,
          kid2Color: data.kid2_color,
          parent1Color: data.parent1_color,
          parent2Color: data.parent2_color,
          housekeeperColor: data.housekeeper_color,
        });
      } else {
        // Create default settings
        await createDefaultSettings(forceHouseholdId);
      }
    } catch (error) {
      console.error('Error loading family settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async (householdId?: string) => {
    if (!user) return;

    try {
      // If no household ID provided, fetch it
      let finalHouseholdId = householdId;
      if (!finalHouseholdId) {
        const { data: householdData } = await supabase
          .from('households')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (householdData) {
          finalHouseholdId = householdData.id;
        }
      }

      const insertData: any = {
        user_id: user.id,
        parent1_name: DEFAULT_SETTINGS.parent1Name,
        parent2_name: DEFAULT_SETTINGS.parent2Name,
        kid1_name: DEFAULT_SETTINGS.kid1Name,
        kid2_name: DEFAULT_SETTINGS.kid2Name,
        housekeeper_name: DEFAULT_SETTINGS.housekeeperName,
        kid1_color: DEFAULT_SETTINGS.kid1Color,
        kid2_color: DEFAULT_SETTINGS.kid2Color,
        parent1_color: DEFAULT_SETTINGS.parent1Color,
        parent2_color: DEFAULT_SETTINGS.parent2Color,
        housekeeper_color: DEFAULT_SETTINGS.housekeeperColor,
      };

      if (finalHouseholdId) {
        insertData.household_id = finalHouseholdId;
      }

      const { error } = await supabase
        .from('family_settings')
        .insert(insertData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<FamilySettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('family_settings')
        .update({
          parent1_name: updatedSettings.parent1Name,
          parent2_name: updatedSettings.parent2Name,
          kid1_name: updatedSettings.kid1Name,
          kid2_name: updatedSettings.kid2Name,
          housekeeper_name: updatedSettings.housekeeperName,
          kid1_color: updatedSettings.kid1Color,
          kid2_color: updatedSettings.kid2Color,
          parent1_color: updatedSettings.parent1Color,
          parent2_color: updatedSettings.parent2Color,
          housekeeper_color: updatedSettings.housekeeperColor,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating family settings:', error);
    }
  };

  const resetSettings = async () => {
    await updateSettings(DEFAULT_SETTINGS);
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
    loading,
    updateSettings,
    resetSettings,
    getFamilyMemberName,
    getFamilyMembers,
    loadSettings,
  };
}
