import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface ActivityLocation {
  id: string;
  household_id: string;
  name: string;
  address?: string;
  phone?: string;
  phone_secondary?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useActivityLocations(householdId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setLocations([]);
      setLoading(false);
      return;
    }
    loadLocations();
  }, [householdId, user]);

  const loadLocations = async () => {
    if (!householdId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_locations")
        .select("*")
        .eq("household_id", householdId)
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error loading activity locations:", error);
      toast({
        title: "Error",
        description: "Failed to load activity locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (location: Omit<ActivityLocation, "id" | "created_at" | "updated_at">) => {
    if (!user || !householdId) return null;

    try {
      const { data, error } = await supabase
        .from("activity_locations")
        .insert({
          ...location,
          household_id: householdId,
        })
        .select()
        .single();

      if (error) throw error;

      setLocations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Success",
        description: "Activity location added",
      });
      return data;
    } catch (error: any) {
      console.error("Error adding activity location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add activity location",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLocation = async (id: string, updates: Partial<ActivityLocation>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("activity_locations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: "Success",
        description: "Activity location updated",
      });
      return true;
    } catch (error: any) {
      console.error("Error updating activity location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update activity location",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("activity_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      toast({
        title: "Success",
        description: "Activity location deleted",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting activity location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity location",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    locations,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: loadLocations,
  };
}
