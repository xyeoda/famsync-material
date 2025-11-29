import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  recipientEmail: string;
  recipientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName }: TestEmailRequest = await req.json();

    console.log(`Sending test email to ${recipientEmail}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
      throw new Error("SMTP configuration is incomplete");
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    const displayName = recipientName || recipientEmail;

    await client.send({
      from: smtpFrom,
      to: recipientEmail,
      subject: "KinSync - Test Email",
      content: "auto",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f7f7f7;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
              }
              .check-icon {
                font-size: 48px;
                color: #10b981;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📧 Test Email Successful!</h1>
            </div>
            <div class="content">
              <p class="check-icon">✅</p>
              <h2>Hello${displayName !== recipientEmail ? ` ${displayName}` : ''}!</h2>
              <p>This is a test email from your KinSync application.</p>
              <p>If you're seeing this message, it means your SMTP configuration is working correctly!</p>
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0;">SMTP Configuration Status</h3>
                <ul style="list-style: none; padding: 0;">
                  <li>✅ SMTP Host: Connected</li>
                  <li>✅ Authentication: Successful</li>
                  <li>✅ Email Delivery: Working</li>
                </ul>
              </div>
              <p>You can now safely send invitation emails to your family members.</p>
              <p style="margin-top: 30px;">
                <strong>Need help?</strong><br>
                If you have any questions about setting up your family calendar, please contact your administrator.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated test email from KinSync</p>
              <p>Sent at ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `,
    });

    await client.close();

    console.log("Test email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent successfully" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);
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
