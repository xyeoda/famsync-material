import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

interface InvitationData {
  email: string;
  role: string;
  household_id: string;
  household_name?: string;
  is_first_parent?: boolean;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This invitation link is invalid",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pending_invitations")
        .select("email, role, household_id, is_first_parent, households(name)")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid or Expired",
          description: "This invitation link is invalid or has expired",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setInvitationData({
        email: data.email,
        role: data.role,
        household_id: data.household_id,
        household_name: (data.households as any)?.name,
        is_first_parent: data.is_first_parent,
      });
    } catch (error: any) {
      console.error("Error verifying token:", error);
      toast({
        title: "Error",
        description: "Failed to verify invitation",
        variant: "destructive",
      });
      navigate("/auth");
    } finally {
      setVerifying(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call the edge function to handle invitation acceptance
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: {
          token,
          password,
        },
      });

      if (error) throw error;
      if (data?.error) {
        // Handle specific error cases
        if (data.error.includes('email address has already been registered') || 
            data.error.includes('email_exists')) {
          toast({
            title: "Account Already Exists",
            description: "This email already has an account. Please check your email for the magic link to sign in, or use the 'Forgot Password' option.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error);
      }

      toast({
        title: "Success!",
        description: "Account created successfully. Signing you in...",
      });

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitationData!.email,
        password,
      });

      if (signInError) throw signInError;

      navigate(`/family/${invitationData!.household_id}`);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitationData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-15"
        style={{ backgroundImage: `url('/src/assets/dashboard-bg.png')` }}
      />
      <Card className="w-full max-w-md mx-4 bg-card/80 backdrop-blur-md border-border/50 relative z-10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          </div>
          <CardDescription>
            You've been invited to join {invitationData.household_name || "a household"} as a{" "}
            {invitationData.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitationData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account & Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
