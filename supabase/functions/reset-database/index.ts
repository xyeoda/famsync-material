import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  resetToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] reset-database: Reset database request received`);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] reset-database: No authorization header provided`);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          message: 'You must be logged in to reset the database',
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Create client to verify JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Verify user with the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error(`[${requestId}] reset-database: Invalid or expired token -`, userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] reset-database: Authenticated user ${user.email}`);

    // Check if user is site admin using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('system_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'site_admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error(`[${requestId}] reset-database: Permission denied - User ${user.email} is not a site admin`, roleError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Permission denied',
          message: 'Only site administrators can reset the database',
          requestId 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] reset-database: Site admin ${user.email} verified, proceeding with reset`);

    console.log("Starting database reset...");

    const deletionResults = {
      pendingInvitations: 0,
      eventInstances: 0,
      familyEvents: 0,
      familySettings: 0,
      userRoles: 0,
      households: 0,
      systemRoles: 0,
      profiles: 0,
      authUsers: 0,
    };

    // Delete in correct order to respect foreign key constraints
    const { data: invitations, error: invErr } = await supabaseAdmin
      .from("pending_invitations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (invErr) console.error("Error deleting pending_invitations:", invErr);
    else deletionResults.pendingInvitations = invitations?.length || 0;
    console.log(`Deleted ${deletionResults.pendingInvitations} pending_invitations`);

    const { data: instances, error: instErr } = await supabaseAdmin
      .from("event_instances")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (instErr) console.error("Error deleting event_instances:", instErr);
    else deletionResults.eventInstances = instances?.length || 0;
    console.log(`Deleted ${deletionResults.eventInstances} event_instances`);

    const { data: events, error: evErr } = await supabaseAdmin
      .from("family_events")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (evErr) console.error("Error deleting family_events:", evErr);
    else deletionResults.familyEvents = events?.length || 0;
    console.log(`Deleted ${deletionResults.familyEvents} family_events`);

    const { data: settings, error: setErr } = await supabaseAdmin
      .from("family_settings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (setErr) console.error("Error deleting family_settings:", setErr);
    else deletionResults.familySettings = settings?.length || 0;
    console.log(`Deleted ${deletionResults.familySettings} family_settings`);

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (rolesErr) console.error("Error deleting user_roles:", rolesErr);
    else deletionResults.userRoles = roles?.length || 0;
    console.log(`Deleted ${deletionResults.userRoles} user_roles`);

    const { data: households, error: hhErr } = await supabaseAdmin
      .from("households")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (hhErr) console.error("Error deleting households:", hhErr);
    else deletionResults.households = households?.length || 0;
    console.log(`Deleted ${deletionResults.households} households`);

    const { data: systemRoles, error: sysRolesErr } = await supabaseAdmin
      .from("system_roles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (sysRolesErr) console.error("Error deleting system_roles:", sysRolesErr);
    else deletionResults.systemRoles = systemRoles?.length || 0;
    console.log(`Deleted ${deletionResults.systemRoles} system_roles`);

    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select();
    if (profErr) console.error("Error deleting profiles:", profErr);
    else deletionResults.profiles = profiles?.length || 0;
    console.log(`Deleted ${deletionResults.profiles} profiles`);

    // Delete all auth users
    const { data: users, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
      throw new Error(`Failed to list users: ${listUsersError.message}`);
    }

    if (users?.users && users.users.length > 0) {
      console.log(`Deleting ${users.users.length} auth users...`);
      for (const user of users.users) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Error deleting user ${user.email}:`, deleteError);
        } else {
          console.log(`Deleted user: ${user.email}`);
          deletionResults.authUsers++;
        }
      }
      // Delay to ensure auth cleanup propagates
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log("No auth users to delete");
    }

    console.log(`[${requestId}] reset-database: Complete - all data wiped`, deletionResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database reset complete",
        deletedCounts: deletionResults,
        requestId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] reset-database: Unexpected error:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to reset database. Please try again or contact support.',
        requestId 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
