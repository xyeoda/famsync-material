import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/app-client";
import { useSystemRole } from "@/hooks/useSystemRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { EmailPreview } from "@/components/Admin/EmailPreview";
import { EmailTracking } from "@/components/Admin/EmailTracking";
import { InvitationAnalytics } from "@/components/Admin/InvitationAnalytics";
import { Loader2, Users, Plus, KeyRound, Mail, Trash2, LogOut, Eye, Activity, TrendingUp, Database } from "lucide-react";

interface Household {
  id: string;
  name: string;
  ownerEmail: string | null;
  memberCount: number;
  createdAt: string;
  pendingInvitations: Array<{
    id: string;
    email: string;
    role: string;
    created_at: string;
    expires_at: string;
  }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSiteAdmin, loading: roleLoading } = useSystemRole();
  const [loading, setLoading] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  
  // Create household dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  
  // Reset password dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Delete household dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteHouseholdId, setDeleteHouseholdId] = useState<string | null>(null);
  const [deleteHouseholdName, setDeleteHouseholdName] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  
  // Reset database dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  
  // Email preview and tracking
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailTrackingOpen, setEmailTrackingOpen] = useState(false);
  const [previewHouseholdName, setPreviewHouseholdName] = useState("");

  useEffect(() => {
    if (!roleLoading && !isSiteAdmin) {
      navigate('/auth');
    } else if (isSiteAdmin) {
      fetchHouseholds();
    }
  }, [isSiteAdmin, roleLoading, navigate]);

  const fetchHouseholds = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-households');
      
      if (error) throw error;
      
      setHouseholds(data.households || []);
    } catch (error: any) {
      console.error('Error fetching households:', error);
      toast({
        title: "Error",
        description: "Failed to load households",
        variant: "destructive",
      });
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName || !parentEmail) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create household
      const { data: householdData, error: householdError } = await supabase.functions.invoke('admin-create-household', {
        body: { name: householdName }
      });

      if (householdError) throw householdError;

      // Invite first parent
      const { error: inviteError } = await supabase.functions.invoke('admin-invite-parent', {
        body: {
          email: parentEmail,
          householdId: householdData.household.id,
          householdName: householdName
        }
      });

      if (inviteError) throw inviteError;

      toast({
        title: "Success!",
        description: `Family "${householdName}" created and invitation sent to ${parentEmail}`,
      });

      setCreateDialogOpen(false);
      setHouseholdName("");
      setParentEmail("");
      fetchHouseholds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create household",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: selectedUserId,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Password reset successfully. User will need to change it on next login.",
      });

      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerForgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-trigger-forgot-password', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Password reset email sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-resend-invitation', {
        body: { invitationId }
      });

      if (error) throw error;

      toast({
        title: "Invitation Resent",
        description: `Invitation email has been resent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (deleteConfirmName !== deleteHouseholdName) {
      toast({
        title: "Error",
        description: "Please type the household name exactly to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-delete-household', {
        body: { householdId: deleteHouseholdId }
      });

      if (error) throw error;

      toast({
        title: "Household Deleted",
        description: "Household and all associated users have been deleted",
      });

      setDeleteDialogOpen(false);
      setDeleteConfirmName("");
      setDeleteHouseholdId(null);
      setDeleteHouseholdName("");
      fetchHouseholds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete household",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleResetDatabase = async () => {
    if (resetConfirmText !== "RESET") {
      toast({
        title: "Error",
        description: "Please type RESET exactly to confirm",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('reset-database');

      if (error) throw error;

      toast({
        title: "Database Reset",
        description: "All data has been wiped. You will be signed out.",
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset database",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Site Administration</h1>
            <p className="text-muted-foreground mt-2">Manage families and users</p>
          </div>
          <Button variant="outlined" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Create Family Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Family
            </CardTitle>
            <CardDescription>
              Create a household and invite the first parent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Family
            </Button>
          </CardContent>
        </Card>

        {/* Invitation Analytics */}
        <InvitationAnalytics />

        {/* Email Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Management
            </CardTitle>
            <CardDescription>
              Preview invitation emails and track delivery status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button 
              onClick={() => {
                setPreviewHouseholdName("Example Family");
                setEmailPreviewOpen(true);
              }}
              variant="outlined"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Email
            </Button>
            <Button 
              onClick={() => setEmailTrackingOpen(true)}
              variant="outlined"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Email Tracking
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Event Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Bulk Event Management
            </CardTitle>
            <CardDescription>
              Export, edit, and re-import events with smart duplicate detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/admin/bulk-events')}
              variant="outlined"
            >
              <Database className="h-4 w-4 mr-2" />
              Manage Events in Bulk
            </Button>
          </CardContent>
        </Card>

        {/* Households Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Households
            </CardTitle>
            <CardDescription>
              View and manage all family households
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household Name</TableHead>
                    <TableHead>Owner Email</TableHead>
                    <TableHead>Pending Invitations</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {households.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No households created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    households.map((household) => (
                      <TableRow key={household.id}>
                        <TableCell className="font-medium">{household.name}</TableCell>
                        <TableCell>{household.ownerEmail || "Pending"}</TableCell>
                        <TableCell>
                          {household.pendingInvitations.length > 0 ? (
                            <div className="space-y-1">
                              {household.pendingInvitations.map((inv) => (
                                <div key={inv.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground">{inv.email}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => handleResendInvitation(inv.id, inv.email)}
                                    disabled={loading}
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Resend
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell>{household.memberCount}</TableCell>
                        <TableCell>{new Date(household.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {household.ownerEmail && (
                              <Button
                                size="sm"
                                variant="outlined"
                                onClick={() => handleTriggerForgotPassword(household.ownerEmail!)}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Reset Email
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeleteHouseholdId(household.id);
                                setDeleteHouseholdName(household.name);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will permanently delete all data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <h3 className="font-semibold mb-2">Reset All Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                <li>All households and their members</li>
                <li>All events and calendar data</li>
                <li>All user accounts (including yours)</li>
                <li>All pending invitations</li>
              </ul>
              <p className="text-sm font-semibold mb-4">
                You will be signed out and redirected to set up a new admin account.
              </p>
              <Button 
                variant="destructive" 
                onClick={() => setResetDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Household Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Family</DialogTitle>
              <DialogDescription>
                Create a new household and invite the first parent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="household-name">Household Name</Label>
                <Input
                  id="household-name"
                  placeholder="The Smith Family"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-email">First Parent Email</Label>
                <Input
                  id="parent-email"
                  type="email"
                  placeholder="parent@example.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This parent will be the household owner
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outlined" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHousehold} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>
                Set a temporary password for the user. They will need to change it on next login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Temporary Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter temporary password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outlined" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Household Alert Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Household & All Users</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  This will permanently delete the household "{deleteHouseholdName}" and ALL associated users.
                  This action cannot be undone.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">Type the household name to confirm:</Label>
                  <Input
                    id="confirm-delete"
                    placeholder={deleteHouseholdName}
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteConfirmName("");
                setDeleteHouseholdId(null);
                setDeleteHouseholdName("");
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteHousehold}
                disabled={loading || deleteConfirmName !== deleteHouseholdName}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Household
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Database Alert Dialog */}
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Reset All Data</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p className="font-semibold text-destructive">
                    WARNING: This action cannot be undone!
                  </p>
                  <p>
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All households and family data</li>
                    <li>All events and calendar entries</li>
                    <li>All user accounts including yours</li>
                    <li>All pending invitations</li>
                    <li>All system settings</li>
                  </ul>
                  <p className="font-semibold">
                    After reset, you will be signed out and can set up a new admin account.
                  </p>
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="confirm-reset">Type <span className="font-mono font-bold">RESET</span> to confirm:</Label>
                    <Input
                      id="confirm-reset"
                      placeholder="RESET"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setResetConfirmText("");
                setResetDialogOpen(false);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetDatabase}
                disabled={loading || resetConfirmText !== "RESET"}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Email Preview Dialog */}
        <EmailPreview
          open={emailPreviewOpen}
          onOpenChange={setEmailPreviewOpen}
          householdName={previewHouseholdName}
        />

        {/* Email Tracking Dialog */}
        <EmailTracking
          open={emailTrackingOpen}
          onOpenChange={setEmailTrackingOpen}
        />
      </div>
    </div>
  );
}
