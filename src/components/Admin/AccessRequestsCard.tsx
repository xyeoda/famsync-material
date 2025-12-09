import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/app-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Check, X, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface AccessRequest {
  id: string;
  household_name: string;
  requester_name: string;
  requester_email: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function AccessRequestsCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  
  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approveHouseholdName, setApproveHouseholdName] = useState("");
  
  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching access requests:', error);
    }
  };

  const handleApproveClick = (request: AccessRequest) => {
    setSelectedRequest(request);
    setApproveHouseholdName(request.household_name);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (request: AccessRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-approve-access-request', {
        body: {
          requestId: selectedRequest.id,
          householdName: approveHouseholdName,
        }
      });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: `Family created and invitation sent to ${selectedRequest.requester_email}`,
      });

      setApproveDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-reject-access-request', {
        body: {
          requestId: selectedRequest.id,
          reason: rejectReason || undefined,
        }
      });

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The access request has been rejected",
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Access Requests
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount} pending</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchRequests}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Review and manage family access requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No access requests yet
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family Name</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.household_name}</TableCell>
                      <TableCell>{request.requester_name}</TableCell>
                      <TableCell>{request.requester_email}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outlined"
                              onClick={() => handleApproveClick(request)}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectClick(request)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status !== 'pending' && request.reviewed_at && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(request.reviewed_at), 'MMM d')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              This will create a household and send an invitation to {selectedRequest?.requester_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                value={approveHouseholdName}
                onChange={(e) => setApproveHouseholdName(e.target.value)}
                placeholder="Family name"
              />
            </div>
            {selectedRequest?.message && (
              <div className="space-y-2">
                <Label>Requester's Message</Label>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {selectedRequest.message}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading || !approveHouseholdName}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve & Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Access Request</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason (Optional)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
