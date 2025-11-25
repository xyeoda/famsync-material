import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface HouseholdContextType {
  householdId: string | null;
  householdName: string;
  canEdit: boolean;
  isDisplayMode: boolean;
  loading: boolean;
  displayUrl: string | null;
  userRole: "parent" | "helper" | "kid" | null;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { householdId: urlHouseholdId } = useParams();
  const { user } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState("My Family");
  const [loading, setLoading] = useState(true);
  const { role: userRole, canEdit: roleCanEdit, loading: roleLoading } = useUserRole(householdId);

  useEffect(() => {
    const loadHousehold = async () => {
      // If we have a URL household ID (display mode)
      if (urlHouseholdId) {
        setHouseholdId(urlHouseholdId);
        
        // Load household name
        const { data } = await supabase
          .from('households')
          .select('name')
          .eq('id', urlHouseholdId)
          .single();
        
        if (data) {
          setHouseholdName(data.name);
        }
        setLoading(false);
        return;
      }

      // If user is logged in, load their household
      if (user) {
        const { data, error } = await supabase
          .from('households')
          .select('id, name')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading household:", error);
        } else if (data) {
          setHouseholdId(data.id);
          setHouseholdName(data.name);
        }
      }
      
      setLoading(false);
    };

    loadHousehold();
  }, [user, urlHouseholdId]);

  const isDisplayMode = !!urlHouseholdId;
  const canEdit = !isDisplayMode && roleCanEdit;
  const displayUrl = householdId && !isDisplayMode
    ? `${window.location.origin}/display/${householdId}`
    : null;

  return (
    <HouseholdContext.Provider
      value={{
        householdId,
        householdName,
        canEdit,
        isDisplayMode,
        loading: loading || roleLoading,
        displayUrl,
        userRole,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within HouseholdProvider");
  }
  return context;
}
