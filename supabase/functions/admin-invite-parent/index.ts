import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

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

    // Send invitation email
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/accept-invite?token=${token}`;
    
    const emailResponse = await supabaseAdmin.functions.invoke('send-invitation', {
      body: {
        to: email,
        inviteUrl,
        householdName,
        role: 'parent'
      }
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
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
