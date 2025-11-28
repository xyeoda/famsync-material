import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteParentRequest {
  email: string;
  householdId: string;
  householdName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

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
      return new Response(
        JSON.stringify({ error: 'Only site administrators can invite parents' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { email, householdId, householdName } = await req.json() as InviteParentRequest;

    if (!email || !householdId || !householdName) {
      return new Response(
        JSON.stringify({ error: 'Email, household ID, and household name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomUUID();

    // Create pending invitation with is_first_parent flag
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('pending_invitations')
      .insert({
        email: email.toLowerCase(),
        household_id: householdId,
        invited_by: user.id,
        role: 'parent',
        token,
        is_first_parent: true
      })
      .select()
      .maybeSingle();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      throw invitationError;
    }

    // Send invitation email directly via SMTP
    const siteUrl = Deno.env.get('SITE_URL') || 
      Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
    const inviteUrl = `${siteUrl}/accept-invite/${token}`;
    
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
        to: email,
        subject: `You're invited to join ${householdName}'s calendar`,
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
                  <h1 style="margin: 0;">You're Invited!</h1>
                </div>
                <div class="content">
                  <p>Hello!</p>
                  <p>You've been invited by a site administrator to join <strong>${householdName}</strong>'s family calendar as a parent.</p>
                  <p>Click the button below to accept your invitation and set up your account:</p>
                  <div style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Accept Invitation</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br>${inviteUrl}</p>
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                    This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
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
      console.log('Invitation email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't throw - invitation is created, email is just a notification
    }

    // Log action
    await supabaseAdmin.from('admin_audit_log').insert({
      action_type: 'invite_parent',
      performed_by: user.id,
      target_household_id: householdId,
      metadata: { email, household_name: householdName }
    });

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
