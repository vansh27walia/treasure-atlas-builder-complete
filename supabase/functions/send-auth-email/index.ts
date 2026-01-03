import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auth email function invoked');
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      });
    }

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { 
      email, 
      type, 
      confirmationUrl, 
      resetUrl,
      userName 
    } = requestBody;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing');
      return new Response(JSON.stringify({ 
        error: 'Email service not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    let subject = '';
    let emailHtml = '';

    const websiteUrl = 'https://shippingquick.io';
    const appUrl = 'https://app.shippingquick.io';
    const displayName = userName || 'there';

    if (type === 'signup' || type === 'confirmation') {
      subject = 'Welcome to ShippingQuick.io - Confirm Your Email';
      const safeConfirmationUrl = normalizeConfirmationUrl(confirmationUrl, `${appUrl}/auth`);
      emailHtml = generateSignupEmailTemplate(displayName, safeConfirmationUrl, websiteUrl);
    } else if (type === 'password_reset' || type === 'recovery') {
      subject = 'Reset Your Password - ShippingQuick.io';
      emailHtml = generatePasswordResetEmailTemplate(displayName, resetUrl || websiteUrl, websiteUrl);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid email type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Sending ${type} email to ${email}`);

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'ShippingQuick.io <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend API error:', emailError);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: emailError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in send-auth-email function:', error);
    return new Response(JSON.stringify({
      error: 'Email service error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function normalizeConfirmationUrl(rawUrl: unknown, fallbackRedirectUrl: string): string {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) return fallbackRedirectUrl;

  try {
    const url = new URL(rawUrl);
    // Supabase uses redirect_to for email confirmation links
    url.searchParams.set('redirect_to', fallbackRedirectUrl);
    return url.toString();
  } catch {
    return fallbackRedirectUrl;
  }
}

function generateSignupEmailTemplate(name: string, confirmationUrl: string, websiteUrl: string): string {
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
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <div style="display: inline-block; background-color: white; padding: 14px 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <span style="font-size: 26px; font-weight: 700; color: #0284c7;">📦 ShippingQuick.io</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Welcome Aboard! 🎉
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Your shipping journey starts here
          </p>
        </div>
        
        <!-- Main Content -->
        <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <p style="color: #334155; font-size: 18px; line-height: 1.6; margin-top: 0;">
            Hey ${name}! 👋
          </p>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.7;">
            Thank you for signing up for <strong style="color: #0284c7;">ShippingQuick.io</strong>! We're excited to have you join our community of smart shippers who save time and money on every shipment.
          </p>
          
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #10b981;">
            <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              ✅ Almost There!
            </p>
            <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.6;">
              Click the button below to confirm your email address and activate your account.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4); transition: all 0.3s ease;">
              Confirm Email Address
            </a>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin: 0; word-break: break-all;">
              <a href="${confirmationUrl}" style="color: #0284c7; font-size: 13px; text-decoration: underline;">${confirmationUrl}</a>
            </p>
          </div>
          
          <!-- What's Next Section -->
          <div style="margin: 30px 0;">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px;">🚀 What you can do with ShippingQuick.io:</h3>
            <div style="display: table; width: 100%;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px;">✓</span>
                  <span style="color: #475569; font-size: 14px; margin-left: 12px;">Compare rates from top carriers instantly</span>
                </div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px;">✓</span>
                  <span style="color: #475569; font-size: 14px; margin-left: 12px;">Create shipping labels in seconds</span>
                </div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #10b981; font-size: 18px;">✓</span>
                  <span style="color: #475569; font-size: 14px; margin-left: 12px;">Track all your shipments in one place</span>
                </div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px 0;">
                  <span style="color: #10b981; font-size: 18px;">✓</span>
                  <span style="color: #475569; font-size: 14px; margin-left: 12px;">Save up to 70% on shipping costs</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #fcd34d;">
            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
              <strong>⏰ Note:</strong> This confirmation link will expire in 24 hours for security purposes.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If you didn't create an account with ShippingQuick.io, please ignore this email.
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            Powered by <strong style="color: #0284c7;">ShippingQuick.io</strong>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Fast, reliable, and affordable shipping solutions
          </p>
          <div style="margin-top: 15px;">
            <a href="${websiteUrl}" style="color: #0284c7; text-decoration: none; font-size: 12px;">Visit our website</a>
            <span style="color: #cbd5e1; margin: 0 10px;">|</span>
            <a href="mailto:support@shippingquick.io" style="color: #0284c7; text-decoration: none; font-size: 12px;">Contact Support</a>
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

function generatePasswordResetEmailTemplate(name: string, resetUrl: string, websiteUrl: string): string {
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
