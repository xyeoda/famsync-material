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

    // Delete in correct order to respect foreign key constraints
    await supabaseAdmin.from("pending_invitations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted pending_invitations");

    await supabaseAdmin.from("event_instances").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted event_instances");

    await supabaseAdmin.from("family_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted family_events");

    await supabaseAdmin.from("family_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted family_settings");

    await supabaseAdmin.from("user_roles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted user_roles");

    await supabaseAdmin.from("households").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted households");

    await supabaseAdmin.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Deleted profiles");

    // Delete all auth users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    if (users?.users) {
      for (const user of users.users) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`Deleted user: ${user.email}`);
      }
    }

    console.log("Database reset complete");

    return new Response(
      JSON.stringify({ success: true, message: "Database reset complete" }),
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
