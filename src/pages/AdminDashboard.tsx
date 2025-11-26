import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSystemRole } from "@/hooks/useSystemRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Plus, KeyRound, Mail, Trash2, LogOut } from "lucide-react";

interface Household {
  id: string;
  name: string;
  ownerEmail: string | null;
  memberCount: number;
  createdAt: string;
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

  useEffect(() => {
    if (!roleLoading && !isSiteAdmin) {
      navigate('/calendar');
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
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {households.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No households created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    households.map((household) => (
                      <TableRow key={household.id}>
                        <TableCell className="font-medium">{household.name}</TableCell>
                        <TableCell>{household.ownerEmail || "Pending"}</TableCell>
                        <TableCell>{household.memberCount}</TableCell>
                        <TableCell>{new Date(household.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
      </div>
    </div>
  );
}
