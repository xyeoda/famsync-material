import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "parent" | "helper" | "kid";
  householdId: string;
  householdName: string;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${requestId}] send-invitation: Request received`);
    
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error(`[${requestId}] send-invitation: Missing authorization header`);
      return new Response(
        JSON.stringify({ 
          error: "Authentication required",
          message: "You must be logged in to send invitations",
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Extract JWT token and verify user
    const jwtToken = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwtToken);

    if (userError || !user) {
      console.error(`[${requestId}] send-invitation: Authentication failed -`, userError?.message || "No user found");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          message: "Your session has expired. Please log in again.",
          requestId 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${requestId}] send-invitation: Authenticated user ${user.email} (${user.id})`);

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, role, householdId, householdName }: InvitationRequest = await req.json();
    console.log(`[${requestId}] send-invitation: Sending ${role} invitation to ${email} for household ${householdId}`);

    // Verify user is a parent in this household using authenticated client
    const { data: userRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .eq("role", "parent")
      .maybeSingle();

    if (roleError || !userRole) {
      console.error(`[${requestId}] send-invitation: Permission denied - User ${user.email} is not a parent in household ${householdId}`, roleError?.message);
      return new Response(
        JSON.stringify({ 
          error: "Permission denied",
          message: "Only parents can send invitations. Please contact a household parent for help.",
          requestId 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate invitation token and URL using SITE_URL secret with fallback
    const token = crypto.randomUUID();
    const siteUrl = Deno.env.get('SITE_URL') || 
      Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const inviteUrl = `${supabaseUrl}/functions/v1/magic-invite?token=${token}`;

    // Delete any existing pending invitation for this email in this household (needs admin)
    const { error: deleteError } = await supabaseAdmin
      .from("pending_invitations")
      .delete()
      .eq("household_id", householdId)
      .eq("email", email.toLowerCase());

    if (deleteError) {
      console.error(`[${requestId}] send-invitation: Error deleting old invitation for ${email}:`, deleteError.message);
    }

    // Store new invitation in database (needs admin for bypassing RLS)
    const { error: inviteError } = await supabaseAdmin
      .from("pending_invitations")
      .insert({
        household_id: householdId,
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        token,
      });

    if (inviteError) {
      console.error(`[${requestId}] send-invitation: Database error creating invitation:`, inviteError.message, inviteError.details);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create invitation",
          message: "Could not create invitation. Please try again or contact support.",
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via SMTP
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("SMTP_HOST")!,
        port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
        tls: true,
        auth: {
          username: Deno.env.get("SMTP_USER")!,
          password: Deno.env.get("SMTP_PASSWORD")!,
        },
      },
    });

    const roleNames = {
      parent: "Parent",
      helper: "Helper",
      kid: "Family Member",
    };

    try {
      await client.send({
        from: Deno.env.get("SMTP_FROM_EMAIL")!,
        to: email,
        subject: `You're invited to join ${householdName}'s calendar`,
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited! 🎉</h1>
    </div>
    <div class="content">
          <p>Hello!</p>
          <p>You've been invited to join <strong>${householdName}</strong>'s family calendar as a <strong>${roleNames[role]}</strong>.</p>
          <p>Click the button below to join - your account will be automatically created and you'll be signed in:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Join Calendar</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">This invitation will expire in 7 days. You'll be asked to set your password after first sign-in.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from ${householdName}'s Family Calendar</p>
    </div>
  </div>
</body>
</html>`,
      });

      await client.close();
      console.log(`[${requestId}] send-invitation: Email sent successfully to ${email}`);
    } catch (emailError: any) {
      console.error(`[${requestId}] send-invitation: SMTP error sending to ${email}:`, emailError.message, emailError.stack);
      await client.close();
      return new Response(
        JSON.stringify({ 
          error: "Email delivery failed",
          message: "Invitation was created but the email could not be sent. Please contact support.",
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${requestId}] send-invitation: Successfully completed invitation for ${email} to household ${householdId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        requestId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[${requestId}] send-invitation: Unexpected error:`, error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again or contact support.",
        requestId 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
