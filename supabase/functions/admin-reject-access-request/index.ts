import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectRequestBody {
  requestId: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify the caller is a site admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is site admin
    const { data: isAdmin } = await userClient.rpc('is_site_admin', { _user_id: user.id });
    if (!isAdmin) {
      throw new Error("Only site admins can reject access requests");
    }

    const { requestId, reason }: RejectRequestBody = await req.json();

    if (!requestId) {
      throw new Error("Request ID is required");
    }

    // Use service role for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the access request
    const { data: request, error: requestError } = await adminClient
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Access request not found");
    }

    if (request.status !== 'pending') {
      throw new Error("This request has already been processed");
    }

    console.log(`Rejecting access request for ${request.requester_email}`);

    // Update the access request status
    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'rejected',
        admin_notes: reason || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      throw new Error("Failed to update request status");
    }

    // Optionally send rejection email
    // For now, we just update the status - email notification can be added later if needed

    return new Response(
      JSON.stringify({
        success: true,
        message: `Access request rejected`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-reject-access-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
