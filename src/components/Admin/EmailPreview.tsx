import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, X } from "lucide-react";

interface EmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdName: string;
}

export function EmailPreview({ open, onOpenChange, householdName }: EmailPreviewProps) {
  const [selectedRole, setSelectedRole] = useState<"parent" | "helper" | "kid">("parent");

  const roleNames = {
    parent: "Parent",
    helper: "Helper",
    kid: "Family Member",
  };

  const getEmailHTML = () => {
    // Match the actual URL format used in send-invitation edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const inviteUrl = `${supabaseUrl}/functions/v1/magic-invite?token=[TOKEN]`;
    const siteUrl = window.location.origin;
    const logoUrl = `${siteUrl}/kinsynch-logo.png`;
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background: #ffffff; color: #1a1a1a; padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo { width: 48px; height: 48px; margin-bottom: 20px; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .link-text { color: #6b7280; font-size: 14px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e7eb; }
      .container { background-color: #1f2937; }
      .content { background: #1f2937; border-color: #374151; }
      .link-text { background: #111827; color: #9ca3af; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="KinSync Logo" class="logo" style="width: 96px; height: 96px; background-color: #ffffff; padding: 12px; border-radius: 12px;" width="96" height="96" />
      <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
    </div>
    <div class="content">
          <p>Hello!</p>
          <p>You've been invited to join <strong>${householdName}</strong>'s family calendar as a <strong>${roleNames[selectedRole]}</strong>.</p>
          <p>Click the button below to join - your account will be automatically created and you'll be signed in:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Join Calendar</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p class="link-text">${inviteUrl}</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. You'll be asked to set your password after first sign-in.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ${householdName}'s Family Calendar</p>
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </DialogTitle>
          <DialogDescription>
            Preview how invitation emails will appear to recipients
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="role-select">Preview for Role:</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger id="role-select" className="mt-2">
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

          <div className="border rounded-lg overflow-hidden bg-white">
            <div 
              className="email-preview" 
              dangerouslySetInnerHTML={{ __html: getEmailHTML() }}
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outlined">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
