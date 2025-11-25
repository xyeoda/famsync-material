import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminRequest {
  email: string;
  defaultPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, defaultPassword }: CreateAdminRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Checking for existing users...");

    // Check if any users already exist
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUsers?.users && existingUsers.users.length > 0) {
      return new Response(
        JSON.stringify({ error: "Admin already exists. Please reset database first." }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Creating admin user...");

    // Create the admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    const userId = userData.user.id;
    console.log(`Admin user created: ${userId}`);

    // Set must_change_password flag in profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", userId);

    if (profileError) {
      console.error("Error setting must_change_password:", profileError);
    }

    // Create household
    const { data: householdData, error: householdError } = await supabaseAdmin
      .from("households")
      .insert({
        owner_id: userId,
        name: "Admin Family",
      })
      .select()
      .single();

    if (householdError) {
      throw new Error(`Failed to create household: ${householdError.message}`);
    }

    console.log(`Household created: ${householdData.id}`);

    // The trigger should assign parent role, but let's verify it was created
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select()
      .eq("user_id", userId)
      .eq("household_id", householdData.id)
      .single();

    if (!roleData) {
      // Manually assign parent role if trigger didn't work
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          household_id: householdData.id,
          role: "parent",
        });

      if (roleError) {
        console.error("Error assigning parent role:", roleError);
      } else {
        console.log("Parent role manually assigned");
      }
    } else {
      console.log("Parent role assigned via trigger");
    }

    // Update family_settings with household_id
    const { error: settingsError } = await supabaseAdmin
      .from("family_settings")
      .update({ household_id: householdData.id })
      .eq("user_id", userId);

    if (settingsError) {
      console.error("Error updating family_settings:", settingsError);
    }

    console.log("Admin setup complete");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created successfully",
        userId,
        householdId: householdData.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in create-admin function:", error);
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
