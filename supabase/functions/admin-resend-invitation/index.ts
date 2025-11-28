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
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Reminder: You're Invited!</h1>
                </div>
                <div class="content">
                  <p>Hello!</p>
                  <p>This is a reminder that you've been invited to join <strong>${householdName}</strong>'s family calendar as a parent.</p>
                  <p>Click the button below to join - you'll be automatically signed in:</p>
                  <div style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Join Now</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>${inviteUrl}</p>
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                    This invitation will expire in 7 days from the original send date. If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
                <div class="footer">
                  <p>Family Calendar App</p>
                </div>
              </div>
            </body>
          </html>
        `,
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
