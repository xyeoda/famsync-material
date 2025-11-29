import { useEffect, useState } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/app-client";
import { Card } from "@/components/ui/card";

interface FamilyLayoutProps {
  children?: React.ReactNode;
}

export function FamilyLayout({ children }: FamilyLayoutProps) {
  const { householdId } = useParams<{ householdId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Always wait for auth to finish loading first
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!householdId) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // If no user after auth loaded, they don't have access
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has access to this household
        const { data, error } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("household_id", householdId)
          .maybeSingle();

        if (error) {
          console.error("Error checking household access:", error);
          setHasAccess(false);
        } else {
          setHasAccess(!!data);
        }
      } catch (error) {
        console.error("Error checking household access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [householdId, user, authLoading]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this family's calendar.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline"
          >
            Go to Sign In
          </button>
        </Card>
      </div>
    );
  }

  // Render children or Outlet
  return children || <Outlet />;
}
