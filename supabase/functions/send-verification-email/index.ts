import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_VERIFICATION_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature if secret is set
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      try {
        wh.verify(payload, headers);
      } catch (err) {
        console.error("Webhook verification failed:", err);
      }
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = JSON.parse(payload) as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const verificationLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .logo { width: 60px; height: 60px; background-color: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; }
            .header-title { color: white; font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .welcome { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
            .message { font-size: 16px; color: #4a5568; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .code-section { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
            .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2d3748; letter-spacing: 4px; }
            .footer { padding: 30px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0; }
            .divider { text-align: center; margin: 30px 0; color: #cbd5e0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌍</div>
              <h1 class="header-title">Wanderer</h1>
            </div>
            
            <div class="content">
              <h2 class="welcome">Welcome to Wanderer!</h2>
              <p class="message">
                Thank you for signing up! We're excited to have you join our community of explorers. 
                To get started, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              
              <div class="divider">───── OR ─────</div>
              
              <div class="code-section">
                <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">Enter this code:</p>
                <div class="code">${token}</div>
              </div>
              
              <p class="message" style="font-size: 14px; margin-top: 30px;">
                If you didn't create an account with Wanderer, you can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2025 Wanderer. All rights reserved.</p>
              <p style="margin-top: 10px;">Your adventure companion for exploring the world.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Wanderer <onboarding@resend.dev>",
      to: [user.email],
      subject: "Verify your Wanderer account",
      html: emailHtml,
    });

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
