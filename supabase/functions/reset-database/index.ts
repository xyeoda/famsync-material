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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resetToken }: ResetRequest = await req.json();

    // Verify reset token (you can change this to a secure value)
    const RESET_TOKEN = Deno.env.get("RESET_DATABASE_TOKEN") || "RESET_ALL_DATA_NOW";
    
    if (resetToken !== RESET_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Invalid reset token" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Starting database reset...");

    const deletionResults = {
      pendingInvitations: 0,
      eventInstances: 0,
      familyEvents: 0,
      familySettings: 0,
      userRoles: 0,
      households: 0,
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

    console.log("Database reset complete - all data wiped", deletionResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Database reset complete",
        deletedCounts: deletionResults
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in reset-database function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
