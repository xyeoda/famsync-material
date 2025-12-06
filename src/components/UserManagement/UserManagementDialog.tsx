import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/app-client";
import { EmailPreview } from "@/components/Admin/EmailPreview";
import { EmailTracking } from "@/components/Admin/EmailTracking";
import { Trash2, UserPlus, Loader2, Mail, Copy, Eye, Activity } from "lucide-react";

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: string;
  householdName: string;
}

interface HouseholdMember {
  id: string;
  email: string;
  role: "parent" | "helper" | "kid";
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: "parent" | "helper" | "kid";
  created_at: string;
  token: string;
}

export function UserManagementDialog({
  open,
  onOpenChange,
  householdId,
  householdName,
}: UserManagementDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"parent" | "helper" | "kid">("kid");
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailTrackingOpen, setEmailTrackingOpen] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      // Load members first
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          role,
          created_at,
          profiles:user_id (
            email
          )
        `)
        .eq("household_id", householdId);

      if (error) throw error;

      const mappedMembers = (data || []).map((item: any) => ({
        id: item.id,
        email: item.profiles?.email || "Unknown",
        role: item.role,
        created_at: item.created_at,
      }));

      setMembers(mappedMembers);

      // Now load pending invites, excluding already-joined members
      const memberEmails = mappedMembers.map((m: HouseholdMember) => m.email.toLowerCase());
      
      const { data: inviteData, error: inviteError } = await supabase
        .from("pending_invitations")
        .select("*")
        .eq("household_id", householdId)
        .gt("expires_at", new Date().toISOString());

      if (inviteError) throw inviteError;

      // Filter out invitations for users who have already joined
      const filteredInvites = (inviteData || []).filter(
        (invite: PendingInvitation) => !memberEmails.includes(invite.email.toLowerCase())
      );

      setPendingInvites(filteredInvites);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, householdId]);

  const handleSendInvitation = async () => {
    if (!email || !role) {
      toast({
        title: "Missing information",
        description: "Please enter an email and select a role",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email,
          role,
          householdId,
          householdName,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      });

      setEmail("");
      setRole("kid");
      loadData();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "The member has been removed from the household",
      });

      setMemberToRemove(null);
      loadData();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Failed to remove member",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("pending_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });

      loadData();
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Failed to cancel invitation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const { error } = await supabase.functions.invoke("send-test-email", {
        body: {
          recipientEmail: user.email,
        },
      });

      if (error) throw error;

      toast({
        title: "Test email sent",
        description: `A test email has been sent to ${user.email}`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to send test email",
        description: error.message || "Please check your SMTP settings",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "parent":
        return "default";
      case "helper":
        return "secondary";
      case "kid":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Household Members</DialogTitle>
          <DialogDescription>
            Invite family members and manage their access to the calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite new member */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite New Member
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent (Full Access)</SelectItem>
                    <SelectItem value="helper">Helper (View Only)</SelectItem>
                    <SelectItem value="kid">Kid (View Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSendInvitation} disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
            <Button 
              onClick={handleSendTestEmail} 
              disabled={sendingTest} 
              variant="outlined" 
              className="w-full gap-2"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => setEmailPreviewOpen(true)}
                variant="outlined" 
                className="flex-1 gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button 
                onClick={() => setEmailTrackingOpen(true)}
                variant="outlined" 
                className="flex-1 gap-2"
              >
                <Activity className="h-4 w-4" />
                Tracking
              </Button>
            </div>
          </div>

          {/* Current members */}
          <div>
            <h3 className="font-semibold mb-3">Current Members</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToRemove(member.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Pending Invitations</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Invitation Link</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(invite.role)}>
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invite.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(invite.token)}
                            className="gap-2 h-8"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Link
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvitation(invite.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the household? They will lose access to the calendar immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => memberToRemove && handleRemoveMember(memberToRemove)} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Preview Dialog */}
      <EmailPreview
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        householdName={householdName}
      />

      {/* Email Tracking Dialog */}
      <EmailTracking
        open={emailTrackingOpen}
        onOpenChange={setEmailTrackingOpen}
        householdId={householdId}
      />
    </Dialog>
  );
}