import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendInvitationRequest {
  invitationId: string;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] admin-resend-invitation: Request received`);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] admin-resend-invitation: Missing authorization header`);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          message: 'You must be logged in to resend invitations',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Extract JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error(`[${requestId}] admin-resend-invitation: Authentication failed -`, userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    console.log(`[${requestId}] admin-resend-invitation: Authenticated user ${user.email}`);

    // Verify user is site admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('system_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'site_admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error(`[${requestId}] admin-resend-invitation: Permission denied - User ${user.email} is not a site admin`, roleError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Permission denied',
          message: 'Only site administrators can resend invitations',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { invitationId } = await req.json() as ResendInvitationRequest;
    console.log(`[${requestId}] admin-resend-invitation: Resending invitation ${invitationId}`);

    if (!invitationId) {
      console.error(`[${requestId}] admin-resend-invitation: Missing invitation ID`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'Invitation ID is required',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the pending invitation with household name
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('pending_invitations')
      .select(`
        id,
        email,
        token,
        household_id,
        households!inner(name)
      `)
      .eq('id', invitationId)
      .maybeSingle();

    if (invitationError || !invitation) {
      console.error(`[${requestId}] admin-resend-invitation: Invitation ${invitationId} not found -`, invitationError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invitation not found',
          message: 'The invitation could not be found. It may have been used or expired.',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const householdName = (invitation.households as any).name;

    // Construct magic invite URL to auto sign-in the user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const inviteUrl = `${supabaseUrl}/functions/v1/magic-invite?token=${invitation.token}`;
    
    console.log(`[${requestId}] admin-resend-invitation: Sending email to ${invitation.email} for household ${householdName}`);

    // Send invitation email directly via SMTP
    try {
      const smtpClient = new SMTPClient({
        connection: {
          hostname: Deno.env.get('SMTP_HOST')!,
          port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
          tls: true,
          auth: {
            username: Deno.env.get('SMTP_USER')!,
            password: Deno.env.get('SMTP_PASSWORD')!,
          },
        },
      });

      await smtpClient.send({
        from: Deno.env.get('SMTP_FROM_EMAIL')!,
        to: invitation.email,
        subject: `Reminder: You're invited to join ${householdName}'s calendar`,
        html: `<!DOCTYPE html>
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
      <img src="${Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/kinsynch-logo.png" alt="KinSync Logo" class="logo" style="width: 96px; height: 96px;" width="96" height="96" />
      <h1 style="margin: 0; font-size: 28px;">Reminder: You're Invited!</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>This is a reminder that you've been invited to join <strong>${householdName}</strong>'s family calendar as a <strong>Parent</strong>.</p>
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
</html>`,
      });

      await smtpClient.close();
      console.log(`[${requestId}] admin-resend-invitation: Email sent successfully to ${invitation.email}`);
    } catch (emailError: any) {
      console.error(`[${requestId}] admin-resend-invitation: SMTP error sending to ${invitation.email}:`, emailError.message, emailError.stack);
      return new Response(
        JSON.stringify({ 
          error: 'Email delivery failed',
          message: 'Could not send the invitation email. Please check email configuration and try again.',
          requestId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log action
    await supabaseAdmin.from('admin_audit_log').insert({
      action_type: 'resend_invitation',
      performed_by: user.id,
      target_household_id: invitation.household_id,
      metadata: { email: invitation.email, household_name: householdName }
    });

    console.log(`[${requestId}] admin-resend-invitation: Successfully completed for ${invitation.email}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation resent successfully',
        requestId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[${requestId}] admin-resend-invitation: Unexpected error:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again or contact support.',
        requestId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
