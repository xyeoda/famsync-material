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

    // Extract JWT token and decode user info (JWT is already verified by the Edge runtime)
    const jwtToken = authHeader.replace("Bearer ", "").trim();
    const jwtParts = jwtToken.split(".");

    if (jwtParts.length !== 3) {
      console.error(`[${requestId}] send-invitation: Malformed JWT token`);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Your session is invalid. Please log in again.",
          requestId,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string | undefined;
    let userEmail: string | undefined;

    try {
      const payloadJson = atob(jwtParts[1].replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);

      userId = payload.sub;
      userEmail =
        payload.email ||
        payload.user_metadata?.email ||
        payload.user_metadata?.email_address ||
        payload["email"];
    } catch (decodeError) {
      console.error(`[${requestId}] send-invitation: Failed to decode JWT payload`, decodeError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "We could not verify your session. Please log in again.",
          requestId,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      console.error(`[${requestId}] send-invitation: JWT missing subject (user id)`);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Your account could not be identified. Please log in again.",
          requestId,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[${requestId}] send-invitation: Authenticated user ${userEmail ?? "unknown email"} (${userId})`
    );

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, role, householdId, householdName }: InvitationRequest = await req.json();
    console.log(
      `[${requestId}] send-invitation: Sending ${role} invitation to ${email} for household ${householdId}`
    );

    // Verify user is a parent in this household
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("household_id", householdId)
      .eq("role", "parent")
      .maybeSingle();

    if (roleError || !userRole) {
      console.error(
        `[${requestId}] send-invitation: Permission denied - User ${userEmail ?? "unknown email"} (${userId}) is not a parent in household ${householdId}`,
        roleError?.message
      );
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
    const logoUrl = `${siteUrl}/kinsynch-logo.png`;

    // Delete any existing pending invitation for this email in this household (needs admin)
    const { error: deleteError } = await supabaseAdmin
      .from("pending_invitations")
      .delete()
      .eq("household_id", householdId)
      .eq("email", email.toLowerCase());

    if (deleteError) {
      console.error(
        `[${requestId}] send-invitation: Error deleting old invitation for ${email}:`,
        deleteError.message
      );
    }

    // Store new invitation in database (needs admin for bypassing RLS)
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from("pending_invitations")
      .insert({
        household_id: householdId,
        email: email.toLowerCase(),
        role,
        invited_by: userId,
        token,
      })
      .select()
      .single();

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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background: #ffffff; color: #1a1a1a; padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo { width: 48px; height: 48px; margin-bottom: 20px; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #f59e0b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .link-text { color: #6b7280; font-size: 14px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 6px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e7eb; }
      .container { background-color: #1f2937; }
      .content { background: #1f2937; border-color: #374151; }
      .link-text { background: #111827; color: #9ca3af; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="KinSync Logo" class="logo" style="width: 96px; height: 96px; background-color: #ffffff; padding: 12px; border-radius: 12px;" width="96" height="96" />
      <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
    </div>
    <div class="content">
          <p>Hello!</p>
          <p>You've been invited to join <strong>${householdName}</strong>'s family calendar as a <strong>${roleNames[role]}</strong>.</p>
          <p>Click the button below to join - your account will be automatically created and you'll be signed in:</p>
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Join Calendar</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p class="link-text">${inviteUrl}</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. You'll be asked to set your password after first sign-in.</p>
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
      
      // Track email send
      await supabaseAdmin
        .from("email_tracking")
        .insert({
          household_id: householdId,
          recipient_email: email.toLowerCase(),
          email_type: "invitation",
          role,
          invitation_id: inviteData.id,
          sent_by: userId,
        });
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
