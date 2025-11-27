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
  const [isOwner, setIsOwner] = useState(false);
  const { role: userRole, canEdit: roleCanEdit, loading: roleLoading } = useUserRole(householdId);

  useEffect(() => {
    const loadHousehold = async () => {
      // Always use URL household ID when available (family routes)
      if (urlHouseholdId) {
        setHouseholdId(urlHouseholdId);
        
        // Load household name and owner
        const { data } = await supabase
          .from('households')
          .select('name, owner_id')
          .eq('id', urlHouseholdId)
          .single();
        
        if (data) {
          setHouseholdName(data.name);
          setIsOwner(user ? data.owner_id === user.id : false);
        }
        setLoading(false);
        return;
      }
      
      setLoading(false);
    };

    loadHousehold();
  }, [user, urlHouseholdId]);

  // Check if we're in display mode (URL path starts with /display/)
  const isDisplayMode = window.location.pathname.startsWith('/display/');
  const canEdit = !isDisplayMode && (roleCanEdit || isOwner);
  const displayUrl = householdId
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
