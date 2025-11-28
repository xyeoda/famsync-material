import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: AcceptInvitationRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Verifying invitation token...');

    // Verify the invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('pending_invitations')
      .select('email, role, household_id, is_first_parent, households(name)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      console.error('Invalid or expired invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user account for:', invitation.email);

    // Create user account using admin client
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error('User ID not found after creation');
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', userId);

    // If this is the first parent, set them as household owner and create settings
    if (invitation.is_first_parent) {
      console.log('Setting as household owner and creating settings...');

      const { error: ownerError } = await supabaseAdmin
        .from('households')
        .update({ owner_id: userId })
        .eq('id', invitation.household_id);

      if (ownerError) {
        console.error('Error setting household owner:', ownerError);
      }

      const { error: settingsError } = await supabaseAdmin
        .from('family_settings')
        .insert({
          user_id: userId,
          household_id: invitation.household_id,
        });

      if (settingsError) {
        console.error('Error creating family settings:', settingsError);
      }
    }

    console.log('Assigning user role...');

    // Assign user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        household_id: invitation.household_id,
        role: invitation.role,
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting used invitation...');

    // Delete the used invitation
    const { error: deleteError } = await supabaseAdmin
      .from('pending_invitations')
      .delete()
      .eq('token', token);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
    }

    console.log('Invitation accepted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        email: invitation.email,
        household_id: invitation.household_id,
        household_name: (invitation.households as any)?.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in accept-invitation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
