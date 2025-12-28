
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Email function invoked with method:', req.method);
    
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    console.log('User authenticated successfully:', user.email);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { 
      email,
      toEmails, 
      subject, 
      description, 
      labelUrl,
      trackingCode,
      batchResult, 
      batchId,
      isBatch,
      selectedFormats = ['pdf'] 
    } = requestBody;

    console.log('Processing email request for:', { 
      email, 
      toEmails, 
      subject, 
      isBatch, 
      labelUrl: labelUrl ? 'present' : 'missing',
      batchResult: batchResult ? 'present' : 'missing',
      selectedFormats 
    });

    // Determine recipient email(s)
    const recipientEmails = toEmails || (email ? [email] : []);
    
    // Validate required fields
    if (!recipientEmails || recipientEmails.length === 0) {
      console.error('Missing recipient email');
      return new Response(JSON.stringify({ 
        error: 'Missing required fields', 
        details: 'Recipient email is required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Check Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing from environment');
      return new Response(JSON.stringify({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is missing from backend configuration'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Resend API key found, initializing Resend client');
    const resend = new Resend(resendApiKey);

    // Prepare attachments
    const attachments = [];
    const labelsList = [];

    // Handle single label (normal shipping)
    if (labelUrl && !isBatch) {
      try {
        console.log('Fetching single label from:', labelUrl);
        const response = await fetch(labelUrl);
        
        if (!response.ok) {
          console.error('Failed to fetch label:', response.status, response.statusText);
          throw new Error(`Failed to fetch label: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/pdf';
        
        // Determine file extension from URL or content type
        let extension = 'pdf';
        if (labelUrl.includes('.png')) extension = 'png';
        else if (labelUrl.includes('.zpl')) extension = 'zpl';
        else if (contentType.includes('image/png')) extension = 'png';
        
        const filename = trackingCode 
          ? `shipping_label_${trackingCode}.${extension}`
          : `shipping_label_${Date.now()}.${extension}`;
        
        // Convert to base64 for Resend attachment
        const base64Content = base64Encode(new Uint8Array(buffer));
        console.log(`Label fetched successfully, size: ${buffer.byteLength} bytes, base64 length: ${base64Content.length}`);
        
        attachments.push({
          filename,
          content: base64Content,
        });
        
        labelsList.push(`• Shipping Label${trackingCode ? ` (${trackingCode})` : ''}`);
        console.log('Successfully attached single label');
      } catch (error) {
        console.error('Error fetching single label:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch label',
          message: error instanceof Error ? error.message : 'Unable to fetch label for email attachment'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }
    // Handle batch labels
    else if (batchResult?.consolidatedLabelUrls || (isBatch && labelUrl)) {
      const urlsToFetch = batchResult?.consolidatedLabelUrls || { pdf: labelUrl };
      
      for (const format of selectedFormats) {
        if (format === 'scanForm' && batchResult?.scanFormUrl) {
          try {
            console.log('Fetching scan form from:', batchResult.scanFormUrl);
            const response = await fetch(batchResult.scanFormUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const base64Content = base64Encode(new Uint8Array(buffer));
              console.log(`Scan form fetched, size: ${buffer.byteLength} bytes`);
              attachments.push({
                filename: `pickup_manifest_${batchId || Date.now()}.pdf`,
                content: base64Content,
              });
              labelsList.push('• Pickup Manifest (Scan Form)');
              console.log('Successfully attached scan form');
            } else {
              console.error('Failed to fetch scan form:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Error fetching scan form:', error);
          }
          continue;
        }

        const url = urlsToFetch[format];
        if (url) {
          try {
            console.log(`Fetching ${format} label from:`, url);
            const response = await fetch(url);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const base64Content = base64Encode(new Uint8Array(buffer));
              console.log(`${format} label fetched, size: ${buffer.byteLength} bytes`);
              
              // Determine proper extension from URL
              let fileExtension = format;
              if (url.includes('.png')) fileExtension = 'png';
              else if (url.includes('.pdf')) fileExtension = 'pdf';
              else if (url.includes('.zpl')) fileExtension = 'zpl';
              
              const filename = batchId 
                ? `batch_${batchId}_labels.${fileExtension}`
                : `consolidated_labels_${Date.now()}.${fileExtension}`;
              
              attachments.push({
                filename,
                content: base64Content,
              });
              
              labelsList.push(`• ${isBatch ? 'Batch' : 'Consolidated'} ${fileExtension.toUpperCase()} Labels`);
              console.log(`Successfully attached ${format} label`);
            } else {
              console.error(`Failed to fetch ${format} label: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error(`Error fetching ${format} label:`, error);
          }
        }
      }
    }

    if (attachments.length === 0) {
      console.error('No attachments could be prepared');
      return new Response(JSON.stringify({ 
        error: 'No labels available to attach',
        message: 'Unable to fetch any labels for email attachment'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Prepare email content
    const emailSubject = subject || (isBatch ? 'Your Batch Shipping Labels - ShippingQuick.io' : 'Your Shipping Label - ShippingQuick.io');
    
    // Build label URL section if available
    const labelUrlSection = labelUrl ? `
      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #0ea5e9;">
        <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 600; font-size: 14px;">📎 Label Download Link</p>
        <a href="${labelUrl}" style="color: #0284c7; text-decoration: underline; word-break: break-all; font-size: 13px;" target="_blank">${labelUrl}</a>
        <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">Click the link above to download your label directly.</p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <div style="display: inline-block; background-color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 15px;">
              <span style="font-size: 24px; font-weight: 700; color: #0284c7;">📦 ShippingQuick.io</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">
              ${isBatch ? '📋 Batch Shipping Labels' : '🏷️ Your Shipping Label'}
            </h1>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">
              ${description || 'Hello! Your shipping label is ready. Please find it attached to this email for your convenience.'}
            </p>
            
            ${trackingCode ? `
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 10px; margin: 24px 0; border-left: 5px solid #10b981;">
                <p style="margin: 0 0 8px 0; color: #065f46; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</p>
                <p style="margin: 0; color: #047857; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">${trackingCode}</p>
              </div>
            ` : ''}
            
            ${labelUrlSection}
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                📁 Attached Files
              </h3>
              <div style="color: #475569; font-size: 14px; line-height: 1.8;">
                ${labelsList.map(item => `<p style="margin: 4px 0; padding-left: 10px; border-left: 3px solid #0ea5e9;">${item}</p>`).join('')}
              </div>
            </div>
            
            <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #fcd34d;">
              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                <strong>💡 Pro Tip:</strong> Print these labels on 4x6" thermal paper or standard label stock for best results.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Thank you for using <strong style="color: #0284c7;">ShippingQuick.io</strong> for your shipping needs!
            </p>
            
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 25px 20px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">
              Powered by <strong style="color: #0284c7;">ShippingQuick.io</strong>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Fast, reliable, and affordable shipping solutions
            </p>
            <div style="margin-top: 15px;">
              <a href="https://shippingquick.io" style="color: #0284c7; text-decoration: none; font-size: 12px;">Visit our website</a>
              <span style="color: #cbd5e1; margin: 0 10px;">|</span>
              <a href="mailto:support@shippingquick.io" style="color: #0284c7; text-decoration: none; font-size: 12px;">Contact Support</a>
            </div>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Convert single email to array if needed
    const emailArray = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
    
    console.log(`Preparing to send email to ${emailArray.length} recipients with ${attachments.length} attachments`);

    const emailData = {
      from: 'ShippingQuick.io <onboarding@resend.dev>',
      to: emailArray,
      subject: emailSubject,
      html: emailHtml,
      attachments: attachments
    };

    console.log('Sending email via Resend...');
    const { data: emailResult, error: emailError } = await resend.emails.send(emailData);

    if (emailError) {
      console.error('Resend API error:', emailError);
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: emailError.message || 'Unknown Resend error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Email sent successfully via Resend:', emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult?.id || 'unknown',
      recipientCount: emailArray.length,
      attachmentsCount: attachments.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Unexpected error in email-labels function:', error);
    return new Response(JSON.stringify({
      error: 'Email service error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
