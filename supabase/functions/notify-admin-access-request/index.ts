import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize user input to prevent HTML injection
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface AccessRequestPayload {
  id: string;
  household_name: string;
  requester_name: string;
  requester_email: string;
  message?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AccessRequestPayload = await req.json();
    console.log("Received access request notification payload:", payload);

    const { id, household_name, requester_name, requester_email, message } = payload;

    if (!id || !household_name || !requester_name || !requester_email) {
      console.error("Missing required fields in payload");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all site admin emails
    const { data: adminRoles, error: adminError } = await supabase
      .from("system_roles")
      .select("user_id")
      .eq("role", "site_admin");

    if (adminError) {
      console.error("Error fetching admin roles:", adminError);
      throw adminError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No site admins found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .in("id", adminUserIds)
      .not("email", "is", null);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw profilesError;
    }

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ success: true, message: "No admin emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to ${adminEmails.length} admin(s)`);

    // Sanitize user inputs
    const safeHouseholdName = escapeHtml(household_name);
    const safeRequesterName = escapeHtml(requester_name);
    const safeRequesterEmail = escapeHtml(requester_email);
    const safeMessage = message ? escapeHtml(message) : null;

    const siteUrl = Deno.env.get("SITE_URL") || "https://kinsynch.lovable.app";
    const adminDashboardUrl = `${siteUrl}/admin`;

    // Build message section
    const messageSection = safeMessage
      ? `<p style="margin: 16px 0; padding: 12px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;"><strong>Message from requester:</strong><br/>${safeMessage}</p>`
      : '';

    // Create SMTP client
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

    // Send email to each admin
    const emailPromises = adminEmails.map(async (adminEmail) => {
      try {
        await client.send({
          from: Deno.env.get("SMTP_FROM_EMAIL")!,
          to: adminEmail,
          subject: `New Access Request: ${safeHouseholdName}`,
          html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Access Request</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">A new family has requested access to KinSynch:</p>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Household Name:</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${safeHouseholdName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Requester:</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${safeRequesterName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;">${safeRequesterEmail}</td>
          </tr>
        </table>
      </div>
      
      ${messageSection}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${adminDashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Review in Admin Dashboard</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">You can approve or reject this request from the Admin Dashboard.</p>
    </div>
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated notification from KinSynch</p>
    </div>
  </div>
</body>
</html>`,
        });
        console.log(`Notification sent to ${adminEmail}`);
        return { email: adminEmail, success: true };
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        console.error(`Failed to send to ${adminEmail}:`, emailError);
        return { email: adminEmail, success: false, error: errorMessage };
      }
    });

    const results = await Promise.all(emailPromises);
    await client.close();

    const successCount = results.filter(r => r.success).length;
    console.log(`Notifications sent: ${successCount}/${adminEmails.length}`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: adminEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in notify-admin-access-request:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
