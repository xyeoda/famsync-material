import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApproveRequestBody {
  requestId: string;
  householdName: string;
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
      throw new Error("Only site admins can approve access requests");
    }

    const { requestId, householdName }: ApproveRequestBody = await req.json();

    if (!requestId || !householdName) {
      throw new Error("Request ID and household name are required");
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

    console.log(`Approving access request for ${request.requester_email}`);

    // Create household (without owner initially)
    const { data: household, error: householdError } = await adminClient
      .from('households')
      .insert({ name: householdName, owner_id: null })
      .select()
      .single();

    if (householdError) {
      console.error('Error creating household:', householdError);
      throw new Error("Failed to create household");
    }

    console.log(`Created household: ${household.id}`);

    // Create invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: inviteError } = await adminClient
      .from('pending_invitations')
      .insert({
        household_id: household.id,
        email: request.requester_email,
        role: 'parent',
        token: token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_first_parent: true,
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw new Error("Failed to create invitation");
    }

    // Update the access request status
    const { error: updateError } = await adminClient
      .from('access_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
    }

    // Send invitation email via send-invitation function
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (smtpHost && smtpPort && smtpUser && smtpPassword && smtpFromEmail) {
      try {
        // Call send-invitation function
        const inviteResponse = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            email: request.requester_email,
            token: token,
            householdName: householdName,
            role: 'parent',
            householdId: household.id,
          }),
        });

        if (!inviteResponse.ok) {
          console.error('Failed to send invitation email');
        } else {
          console.log('Invitation email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
      }
    } else {
      console.log('SMTP not configured, skipping email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        household: { id: household.id, name: householdName },
        message: `Household created and invitation sent to ${request.requester_email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-approve-access-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
