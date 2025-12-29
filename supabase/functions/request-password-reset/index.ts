import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Password reset request received');

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('Processing password reset for email:', email.substring(0, 3) + '***');

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Production redirect URL
    const redirectUrl = 'https://app.shippingquick.io/reset-password';

    // Generate password recovery link using admin API
    // This generates a one-time use link with embedded tokens
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (!linkData?.properties?.action_link) {
      console.error('No action link generated');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const recoveryLink = linkData.properties.action_link;
    console.log('Recovery link generated successfully');

    // Send branded email with Resend
    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY);
      const userName = email.split('@')[0];

      const emailHtml = generatePasswordResetEmailTemplate(userName, recoveryLink);

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: 'ShippingQuick.io <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Your Password - ShippingQuick.io',
        html: emailHtml,
      });

      if (emailError) {
        console.error('Resend error:', emailError);
        // Email failed but we still generated the link - this is a partial failure
        // For production, you might want to handle this differently
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Failed to send email. Please try again.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      console.log('Password reset email sent successfully:', emailResult?.id);
    } else {
      console.warn('RESEND_API_KEY not configured - cannot send email');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Email service not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Success - don't reveal whether email existed
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in request-password-reset function:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred processing your request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function generatePasswordResetEmailTemplate(name: string, resetUrl: string): string {
  const websiteUrl = 'https://shippingquick.io';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <div style="display: inline-block; background-color: white; padding: 14px 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <span style="font-size: 26px; font-weight: 700; color: #4f46e5;">📦 ShippingQuick.io</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            🔐 Password Reset Request
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Let's get you back into your account
          </p>
        </div>
        
        <!-- Main Content -->
        <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <p style="color: #334155; font-size: 18px; line-height: 1.6; margin-top: 0;">
            Hey ${name}! 👋
          </p>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.7;">
            We received a request to reset your password for your <strong style="color: #4f46e5;">ShippingQuick.io</strong> account. No worries - it happens to the best of us!
          </p>
          
          <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); padding: 24px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #8b5cf6;">
            <p style="margin: 0 0 8px 0; color: #5b21b6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              🔑 Reset Your Password
            </p>
            <p style="margin: 0; color: #6d28d9; font-size: 15px; line-height: 1.6;">
              Click the button below to create a new password for your account.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); transition: all 0.3s ease;">
              Reset My Password
            </a>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${resetUrl}" style="color: #4f46e5; font-size: 13px; text-decoration: underline;">${resetUrl}</a>
            </p>
          </div>
          
          <!-- Security Notice -->
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #fecaca;">
            <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px;">
              🛡️ Security Notice
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #b91c1c; font-size: 13px; line-height: 1.8;">
              <li>This link will expire in 1 hour for your security</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
              <li>This link can only be used once</li>
            </ul>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
              <strong>💡 Tip:</strong> After resetting your password, you'll be redirected to log in with your new credentials.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Need help? Contact our support team at <a href="mailto:support@shippingquick.io" style="color: #4f46e5;">support@shippingquick.io</a>
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Powered by <strong style="color: #4f46e5;">ShippingQuick.io</strong>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Fast, reliable, and affordable shipping solutions
          </p>
          <div style="margin-top: 15px;">
            <a href="${websiteUrl}" style="color: #4f46e5; text-decoration: none; font-size: 12px;">Visit our website</a>
            <span style="color: #cbd5e1; margin: 0 10px;">|</span>
            <a href="mailto:support@shippingquick.io" style="color: #4f46e5; text-decoration: none; font-size: 12px;">Contact Support</a>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; margin-top: 20px;">
            © ${new Date().getFullYear()} ShippingQuick.io. All rights reserved.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}
