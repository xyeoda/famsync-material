import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
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

type EmailType = "invitation" | "password_reset" | "welcome";

export function EmailPreview({ open, onOpenChange, householdName }: EmailPreviewProps) {
  const [selectedRole, setSelectedRole] = useState<"parent" | "helper" | "kid">("parent");
  const [emailType, setEmailType] = useState<EmailType>("invitation");

  const roleNames = {
    parent: "Parent",
    helper: "Helper",
    kid: "Family Member",
  };

  const getInvitationEmailHTML = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const inviteUrl = `${supabaseUrl}/functions/v1/magic-invite?token=[TOKEN]`;
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 40px auto; }
    .content { background: #ffffff; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .title { font-size: 28px; font-weight: 700; margin: 0 0 24px 0; color: #1a1a1a; text-align: center; }
    .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .link-text { color: #6b7280; font-size: 14px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827; color: #e5e7eb; }
      .content { background: #1f2937; border-color: #374151; }
      .title { color: #f9fafb; }
      .link-text { background: #111827; color: #9ca3af; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h1 class="title">You're Invited!</h1>
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

  const getPasswordResetEmailHTML = () => {
    const siteUrl = window.location.origin;
    const resetUrl = `${siteUrl}/reset-password?token=[TOKEN]`;
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 40px auto; }
    .content { background: #ffffff; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .title { font-size: 28px; font-weight: 700; margin: 0 0 24px 0; color: #1a1a1a; text-align: center; }
    .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .link-text { color: #6b7280; font-size: 14px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 20px 0; color: #92400e; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827; color: #e5e7eb; }
      .content { background: #1f2937; border-color: #374151; }
      .title { color: #f9fafb; }
      .link-text { background: #111827; color: #9ca3af; }
      .alert { background: #451a03; border-color: #92400e; color: #fbbf24; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h1 class="title">Reset Your Password</h1>
      <p>Hello,</p>
      <p>We received a request to reset the password for your <strong>${householdName}</strong> family calendar account.</p>
      <div class="alert">
        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </div>
      <p>Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <p class="link-text">${resetUrl}</p>
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">This password reset link will expire in 1 hour for security reasons.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ${householdName}'s Family Calendar</p>
    </div>
  </div>
</body>
</html>`;
  };

  const getWelcomeEmailHTML = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 40px auto; }
    .content { background: #ffffff; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .title { font-size: 28px; font-weight: 700; margin: 0 0 24px 0; color: #1a1a1a; text-align: center; }
    .feature { display: flex; gap: 12px; margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; }
    .feature-icon { font-size: 24px; }
    .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827; color: #e5e7eb; }
      .content { background: #1f2937; border-color: #374151; }
      .title { color: #f9fafb; }
      .feature { background: #111827; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h1 class="title">🎉 Welcome to ${householdName}!</h1>
      <p>Hello,</p>
      <p>Welcome to your family calendar! We're excited to help you manage your family's schedule together.</p>
      
      <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 16px;">What you can do:</h2>
      
      <div class="feature">
        <div class="feature-icon">📅</div>
        <div>
          <strong>Create Events</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">Schedule activities, appointments, and important dates for your family</span>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">👥</div>
        <div>
          <strong>Track Participants</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">See who's attending each event at a glance</span>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🚗</div>
        <div>
          <strong>Manage Transportation</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">Coordinate pickups and drop-offs for your kids</span>
        </div>
      </div>
      
      <div class="feature">
        <div class="feature-icon">🔁</div>
        <div>
          <strong>Recurring Events</strong><br/>
          <span style="color: #6b7280; font-size: 14px;">Set up weekly activities that repeat automatically</span>
        </div>
      </div>
      
      <p style="margin-top: 30px;">We hope you enjoy using the family calendar. If you have any questions, feel free to reach out!</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ${householdName}'s Family Calendar</p>
    </div>
  </div>
</body>
</html>`;
  };

  const getEmailHTML = () => {
    switch (emailType) {
      case "invitation":
        return getInvitationEmailHTML();
      case "password_reset":
        return getPasswordResetEmailHTML();
      case "welcome":
        return getWelcomeEmailHTML();
      default:
        return getInvitationEmailHTML();
    }
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
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="email-type-select">Email Type:</Label>
              <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                <SelectTrigger id="email-type-select" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invitation">Invitation Email</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {emailType === "invitation" && (
              <div>
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
            )}
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <div 
              className="email-preview" 
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getEmailHTML()) }}
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
