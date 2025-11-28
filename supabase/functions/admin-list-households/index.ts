import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
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
        JSON.stringify({ error: 'Only site administrators can list households' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get all households with metadata only
    const { data: households, error: householdsError } = await supabaseAdmin
      .from('households')
      .select('id, name, owner_id, created_at');

    if (householdsError) {
      console.error('Error fetching households:', householdsError);
      throw householdsError;
    }

    // Get owner email, member count, and pending invitations for each household
    const householdsWithDetails = await Promise.all(
      (households || []).map(async (household: any) => {
        // Get owner email
        let ownerEmail = null;
        if (household.owner_id) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', household.owner_id)
            .maybeSingle();
          ownerEmail = profile?.email || null;
        }

        // Get member count
        const { count: memberCount } = await supabaseAdmin
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', household.id);

        // Get pending invitations
        const { data: pendingInvitations } = await supabaseAdmin
          .from('pending_invitations')
          .select('id, email, role, created_at, expires_at')
          .eq('household_id', household.id)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        return {
          id: household.id,
          name: household.name,
          ownerEmail,
          memberCount: memberCount || 0,
          createdAt: household.created_at,
          pendingInvitations: pendingInvitations || []
        };
      })
    );

    return new Response(
      JSON.stringify({ households: householdsWithDetails }),
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
