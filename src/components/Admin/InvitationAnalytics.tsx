import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, CheckCircle2, Mail, MousePointerClick, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalAccepted: number;
  totalErrors: number;
  openRate: number;
  clickRate: number;
  acceptanceRate: number;
  recentErrors: Array<{
    id: string;
    email: string;
    error_type: string;
    error_message: string;
    created_at: string;
    household_name?: string;
  }>;
}

export function InvitationAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get email tracking stats
      const { data: tracking, error: trackingError } = await supabase
        .from("email_tracking")
        .select("*")
        .eq("email_type", "invitation");

      if (trackingError) throw trackingError;

      // Get invitation errors with household names
      const { data: errors, error: errorsError } = await supabase
        .from("invitation_errors")
        .select(`
          *,
          households:household_id (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (errorsError) throw errorsError;

      const totalSent = tracking?.length || 0;
      const totalOpened = tracking?.filter((t) => t.opened_at).length || 0;
      const totalClicked = tracking?.filter((t) => t.clicked_at).length || 0;
      const totalAccepted = tracking?.filter((t) => t.accepted_at).length || 0;
      const totalErrors = errors?.length || 0;

      const mappedErrors = (errors || []).map((err: any) => ({
        ...err,
        household_name: err.households?.name || "Unknown",
      }));

      setAnalytics({
        totalSent,
        totalOpened,
        totalClicked,
        totalAccepted,
        totalErrors,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        acceptanceRate: totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0,
        recentErrors: mappedErrors,
      });
    } catch (error: any) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load invitation analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Invitation Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const getErrorTypeBadge = (errorType: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      invalid_invitation: { variant: "destructive", label: "Invalid" },
      expired_invitation: { variant: "secondary", label: "Expired" },
      already_member: { variant: "outline", label: "Already Member" },
      invitation_failed: { variant: "destructive", label: "Failed" },
    };
    
    const config = variants[errorType] || { variant: "outline", label: errorType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Invitation emails</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalOpened} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalAccepted} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.totalErrors}</div>
            <p className="text-xs text-muted-foreground mt-1">Total errors logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {analytics.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent Invitation Errors
            </CardTitle>
            <CardDescription>
              Latest errors encountered during invitation processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recentErrors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="font-medium">{error.email}</TableCell>
                      <TableCell>{error.household_name}</TableCell>
                      <TableCell>{getErrorTypeBadge(error.error_type)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={error.error_message}>
                        {error.error_message}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
