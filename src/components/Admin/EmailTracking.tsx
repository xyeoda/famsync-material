import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/app-client";
import { useToast } from "@/hooks/use-toast";
import { Activity, CheckCircle2, Mail, MousePointerClick, RefreshCw, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailTrackingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId?: string;
}

interface EmailTrackingRecord {
  id: string;
  recipient_email: string;
  email_type: string;
  role: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  accepted_at: string | null;
  invitation_id: string | null;
  household_id: string;
  household_name?: string;
}

export function EmailTracking({ open, onOpenChange, householdId }: EmailTrackingProps) {
  const [tracking, setTracking] = useState<EmailTrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTracking();
      
      // Set up realtime subscription for email_tracking changes
        const channel = supabase
          .channel('email-tracking-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'email_tracking',
              filter: householdId ? `household_id=eq.${householdId}` : undefined,
            },
            () => {
              // Reload tracking data when changes occur
              loadTracking();
            }
          )
          .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, householdId]);

  const loadTracking = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("email_tracking")
        .select(`
          *,
          households:household_id (
            name
          )
        `)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (householdId) {
        query = query.eq("household_id", householdId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedData = (data || []).map((item: any) => ({
        ...item,
        household_name: item.households?.name || "Unknown",
      }));

      setTracking(mappedData);
    } catch (error: any) {
      console.error("Error loading email tracking:", error);
      toast({
        title: "Error",
        description: "Failed to load email tracking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (record: EmailTrackingRecord) => {
    if (record.accepted_at) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </Badge>
      );
    }
    if (record.clicked_at) {
      return (
        <Badge variant="secondary" className="gap-1">
          <MousePointerClick className="h-3 w-3" />
          Clicked
        </Badge>
      );
    }
    if (record.opened_at) {
      return (
        <Badge variant="outline" className="gap-1">
          <Mail className="h-3 w-3" />
          Opened
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 opacity-50">
        <Activity className="h-3 w-3" />
        Sent
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "invitation":
        return "text-blue-600 dark:text-blue-400";
      case "password_reset":
        return "text-amber-600 dark:text-amber-400";
      case "test":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-foreground";
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setResending(invitationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.functions.invoke("admin-resend-invitation", {
        body: { invitationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation resent to ${email}`,
      });
      
      // No need to manually refresh - realtime subscription will handle it
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setResending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Email Tracking
          </DialogTitle>
          <DialogDescription>
            Monitor email delivery, opens, clicks, and acceptances
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tracking.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email activity yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    {!householdId && <TableHead>Household</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracking.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.recipient_email}
                      </TableCell>
                      {!householdId && (
                        <TableCell>{record.household_name}</TableCell>
                      )}
                      <TableCell>
                        <span className={`capitalize ${getTypeColor(record.email_type)}`}>
                          {record.email_type.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {record.role ? (
                          <Badge variant="outline" className="capitalize">
                            {record.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(record.sent_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {record.opened_at && (
                            <div>Opened: {formatDistanceToNow(new Date(record.opened_at), { addSuffix: true })}</div>
                          )}
                          {record.clicked_at && (
                            <div>Clicked: {formatDistanceToNow(new Date(record.clicked_at), { addSuffix: true })}</div>
                          )}
                          {record.accepted_at && (
                            <div>Accepted: {formatDistanceToNow(new Date(record.accepted_at), { addSuffix: true })}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.email_type === "invitation" && 
                         record.role === "parent" && 
                         !record.accepted_at && 
                         record.invitation_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendInvitation(record.invitation_id!, record.recipient_email)}
                            disabled={resending === record.invitation_id}
                          >
                            {resending === record.invitation_id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Resend
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button onClick={loadTracking} variant="outlined" disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outlined">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
