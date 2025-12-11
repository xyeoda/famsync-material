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

interface RejectRequestBody {
  requestId: string;
  reason?: string;
}

async function sendRejectionEmail(
  email: string,
  requesterName: string,
  householdName: string,
  reason?: string
): Promise<void> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");
  const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFromEmail) {
    console.log("SMTP not configured, skipping rejection email");
    return;
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: parseInt(smtpPort),
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPassword,
      },
    },
  });

  const safeRequesterName = escapeHtml(requesterName);
  const safeHouseholdName = escapeHtml(householdName);
  const safeReason = reason ? escapeHtml(reason) : null;

  const reasonSection = safeReason 
    ? `<p style="margin: 16px 0; padding: 12px; background-color: #f3f4f6; border-radius: 8px;"><strong>Reason:</strong> ${safeReason}</p>`
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">KinSynch</h1>
      </div>
      <div style="background-color: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin-top: 0;">Access Request Update</h2>
        <p>Hi ${safeRequesterName},</p>
        <p>Thank you for your interest in KinSynch. After reviewing your access request for the household "<strong>${safeHouseholdName}</strong>", we regret to inform you that we are unable to approve your request at this time.</p>
        ${reasonSection}
        <p>If you believe this was a mistake or would like to provide additional information, please feel free to submit a new request or contact our support team.</p>
        <p style="margin-top: 24px;">Best regards,<br><strong>The KinSynch Team</strong></p>
      </div>
      <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        <p>This is an automated message from KinSynch.</p>
      </div>
    </body>
    </html>
  `;

  try {
    await client.send({
      from: smtpFromEmail,
      to: email,
      subject: "KinSynch Access Request Update",
      content: "auto",
      html: htmlContent,
    });
    console.log(`Rejection email sent to ${email}`);
  } finally {
    await client.close();
  }
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

    // Send rejection email notification
    try {
      await sendRejectionEmail(
        request.requester_email,
        request.requester_name,
        request.household_name,
        reason
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the request if email fails
    }

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
