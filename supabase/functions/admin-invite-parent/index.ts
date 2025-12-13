import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Extract JWT token and verify user
    const jwtToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwtToken);
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const inviteUrl = `${supabaseUrl}/functions/v1/magic-invite?token=${token}`;
    
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
        subject: `You're invited to join ${escapeHtml(householdName)}'s calendar`,
        html: `<!DOCTYPE html>
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
      <p>You've been invited by a site administrator to join <strong>${escapeHtml(householdName)}</strong>'s family calendar as a <strong>Parent</strong>.</p>
      <p>Click the button below to join - your account will be automatically created and you'll be signed in:</p>
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Join Calendar</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
      <p class="link-text">${inviteUrl}</p>
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. You'll be asked to set your password after first sign-in. If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ${escapeHtml(householdName)}'s Family Calendar</p>
    </div>
  </div>
</body>
</html>`,
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
