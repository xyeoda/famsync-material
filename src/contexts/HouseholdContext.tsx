import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/app-client";

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
      console.log('[HouseholdContext] Starting to load household, urlHouseholdId:', urlHouseholdId, 'user:', user?.email);
      
      // Always use URL household ID when available (family routes)
      if (urlHouseholdId) {
        setHouseholdId(urlHouseholdId);
        
        try {
          // Load household name and owner
          const { data, error } = await supabase
            .from('households')
            .select('name, owner_id')
            .eq('id', urlHouseholdId)
            .maybeSingle();
          
          console.log('[HouseholdContext] Household query result:', { data, error });
          
          if (error) {
            console.error('[HouseholdContext] Error loading household:', error);
          } else if (data) {
            console.log('[HouseholdContext] Setting household name to:', data.name);
            setHouseholdName(data.name);
            const ownerStatus = user ? data.owner_id === user.id : false;
            console.log('[HouseholdContext] Is owner:', ownerStatus, 'owner_id:', data.owner_id, 'user.id:', user?.id);
            setIsOwner(ownerStatus);
          } else {
            console.warn('[HouseholdContext] No household found for ID:', urlHouseholdId);
          }
        } catch (err) {
          console.error('[HouseholdContext] Exception loading household:', err);
        }
        
        setLoading(false);
        return;
      }
      
      console.log('[HouseholdContext] No urlHouseholdId, setting loading false');
      setLoading(false);
    };

    loadHousehold();
  }, [user, urlHouseholdId]);

  // Check if we're in display mode (URL path starts with /display/)
  const isDisplayMode = window.location.pathname.startsWith('/display/');
  const canEdit = !isDisplayMode && (roleCanEdit || isOwner);
  
  console.log('[HouseholdContext] Current state:', {
    householdId,
    householdName,
    userRole,
    roleCanEdit,
    isOwner,
    canEdit,
    isDisplayMode,
    loading,
    roleLoading
  });
  
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
