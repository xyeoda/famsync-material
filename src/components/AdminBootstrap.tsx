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
      // Check if any households exist (indicates admin has been set up)
      const { data, error } = await supabase
        .from('households')
        .select('id')
        .limit(1);

      if (error) {
        console.error("Error checking for admin:", error);
        return;
      }

      // Only show button if no households exist
      setShowButton(!data || data.length === 0);
    } catch (error) {
      console.error("Error checking for admin:", error);
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
