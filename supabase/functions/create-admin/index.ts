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

    // Check if site admin already exists
    const { data: existingAdmin, error: adminError } = await supabaseAdmin
      .from("system_roles")
      .select("id")
      .eq("role", "site_admin")
      .limit(1);

    if (adminError) {
      console.error("Error checking existing admin:", adminError);
    }

    if (existingAdmin && existingAdmin.length > 0) {
      return new Response(
        JSON.stringify({ error: "Site administrator already exists. Please sign in instead." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create the site admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    const userId = userData.user.id;
    console.log(`Site admin user created: ${userId}`);

    // Assign site_admin system role
    const { error: roleError } = await supabaseAdmin
      .from("system_roles")
      .insert({
        user_id: userId,
        role: "site_admin",
      });

    if (roleError) {
      console.error("Error assigning site admin role:", roleError);
      throw new Error(`Failed to assign site admin role: ${roleError.message}`);
    }

    console.log("Site admin role assigned");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Site administrator created successfully",
        userId,
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
