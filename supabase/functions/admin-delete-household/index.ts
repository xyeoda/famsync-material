import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteHouseholdRequest {
  householdId: string;
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
        JSON.stringify({ error: 'Only site administrators can delete households' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { householdId } = await req.json() as DeleteHouseholdRequest;

    if (!householdId) {
      return new Response(
        JSON.stringify({ error: 'Household ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get household name for logging
    const { data: household } = await supabaseAdmin
      .from('households')
      .select('name')
      .eq('id', householdId)
      .maybeSingle();

    // Get all user IDs associated with this household
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('household_id', householdId);

    if (userRolesError) {
      console.error('Error fetching user roles:', userRolesError);
      throw userRolesError;
    }

    const userIds = (userRoles || []).map((role: any) => role.user_id);

    // Delete in correct order to respect foreign keys
    // 1. Event instances
    await supabaseAdmin
      .from('event_instances')
      .delete()
      .eq('household_id', householdId);

    // 2. Family events
    await supabaseAdmin
      .from('family_events')
      .delete()
      .eq('household_id', householdId);

    // 3. Family settings
    await supabaseAdmin
      .from('family_settings')
      .delete()
      .eq('household_id', householdId);

    // 4. Pending invitations
    await supabaseAdmin
      .from('pending_invitations')
      .delete()
      .eq('household_id', householdId);

    // 5. User roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('household_id', householdId);

    // 6. Delete household
    const { error: householdDeleteError } = await supabaseAdmin
      .from('households')
      .delete()
      .eq('id', householdId);

    if (householdDeleteError) {
      console.error('Error deleting household:', householdDeleteError);
      throw householdDeleteError;
    }

    // 7. Delete all users associated with this household
    for (const userId of userIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
      }
    }

    // Log action
    await supabaseAdmin.from('admin_audit_log').insert({
      action_type: 'delete_household',
      performed_by: user.id,
      target_household_id: householdId,
      metadata: { 
        household_name: household?.name || 'Unknown',
        deleted_users_count: userIds.length,
        user_ids: userIds
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Household and all associated users deleted successfully',
        deletedUsersCount: userIds.length
      }),
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
