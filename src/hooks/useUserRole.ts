import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { useAuth } from "./useAuth";

export type AppRole = "parent" | "helper" | "kid";

export function useUserRole(householdId: string | null) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      setLoading(true); // Always set loading to true when effect runs
      
      if (!user || !householdId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("household_id", householdId)
          .single();

        if (error) {
          console.error("Error loading user role:", error);
          setRole(null);
        } else {
          setRole(data.role as AppRole);
        }
      } catch (error) {
        console.error("Error loading user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [user, householdId]);

  const isParent = role === "parent";
  const canEdit = isParent;

  return {
    role,
    isParent,
    canEdit,
    loading,
  };
}
