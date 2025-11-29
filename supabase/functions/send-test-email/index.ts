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

    const siteUrl = Deno.env.get('SITE_URL') || 
      Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com');
    const logoUrl = `${siteUrl}/kinsynch-logo.png`;

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
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1a1a1a;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
              }
              .header {
                background: #000000;
                color: white;
                padding: 40px 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .logo {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .status-box {
                background: #f0fdf4;
                border: 2px solid #10b981;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .status-box h3 {
                margin-top: 0;
                color: #065f46;
              }
              .status-box ul {
                list-style: none;
                padding: 0;
                margin: 10px 0 0 0;
              }
              .status-box li {
                color: #047857;
                padding: 5px 0;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                color: #9ca3af;
                font-size: 12px;
              }
              @media (prefers-color-scheme: dark) {
                body {
                  color: #e5e7eb;
                  background-color: #1f2937;
                }
                .content {
                  background: #1f2937;
                  border-color: #374151;
                }
                .status-box {
                  background: #064e3b;
                  border-color: #10b981;
                }
                .status-box h3 {
                  color: #6ee7b7;
                }
                .status-box li {
                  color: #a7f3d0;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${logoUrl}" alt="KinSync Logo" class="logo" />
              <h1 style="margin: 0; font-size: 28px;">Test Email Successful!</h1>
            </div>
            <div class="content">
              <h2>Hello${displayName !== recipientEmail ? ` ${displayName}` : ''}!</h2>
              <p>This is a test email from your KinSync application.</p>
              <p>If you're seeing this message, it means your SMTP configuration is working correctly!</p>
              <div class="status-box">
                <h3>SMTP Configuration Status</h3>
                <ul>
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
