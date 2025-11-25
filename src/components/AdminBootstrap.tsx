import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminBootstrap() {
  const [showButton, setShowButton] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForExistingAdmin();
  }, []);

  const checkForExistingAdmin = async () => {
    try {
      console.log("[AdminBootstrap] Checking for existing admin...");
      
      // Check if any households exist (indicates admin has been set up)
      const { data, error } = await supabase
        .from('households')
        .select('id')
        .limit(1);

      if (error) {
        console.error("[AdminBootstrap] Error checking for admin:", error);
        // On error, don't show button to be safe
        setShowButton(false);
        return;
      }

      const shouldShow = !data || data.length === 0;
      console.log(`[AdminBootstrap] Households found: ${data?.length || 0}, showing button: ${shouldShow}`);
      
      // Only show button if no households exist
      setShowButton(shouldShow);
    } catch (error) {
      console.error("[AdminBootstrap] Exception checking for admin:", error);
      setShowButton(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
    );
  }

  if (!showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link to="/setup">
        <Button
          variant="elevated"
          size="lg"
          className="gap-2 shadow-lg hover:shadow-xl"
        >
          <Shield className="h-5 w-5" />
          Setup Admin
        </Button>
      </Link>
    </div>
  );
}
