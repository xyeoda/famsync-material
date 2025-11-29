import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/app-client";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminBootstrap() {
  const [showButton, setShowButton] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForExistingAdmin();
  }, []);

  const checkForExistingAdmin = async () => {
    try {
      console.log("[AdminBootstrap] Checking for existing site admin...");
      
      // Use RPC call to secure function instead of direct table query
      const { data, error } = await supabase.rpc('admin_exists');

      if (error) {
        console.error("[AdminBootstrap] Error checking for admin:", error);
        // On error, don't show button to be safe
        setShowButton(false);
        return;
      }

      // data is a boolean - true if admin exists, false if not
      const adminExists = data === true;
      console.log(`[AdminBootstrap] Admin exists: ${adminExists}, showing button: ${!adminExists}`);
      
      // Only show button if no site admin exists
      setShowButton(!adminExists);
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

  // Show setup button if no household exists
  if (showButton) {
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

  return null;
}
