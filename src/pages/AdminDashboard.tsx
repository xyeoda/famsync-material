import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSystemRole } from "@/hooks/useSystemRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Plus } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isSiteAdmin, loading: roleLoading } = useSystemRole();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isSiteAdmin) {
      navigate('/calendar');
    }
  }, [isSiteAdmin, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Site Administration</h1>
          <p className="text-muted-foreground mt-2">Manage families and users</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Management
            </CardTitle>
            <CardDescription>
              Create and manage family households
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Admin dashboard coming soon. You can create families and invite parents.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Family
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
