
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
    const emailSubject = subject || (isBatch ? 'Your Batch Shipping Labels' : 'Your Shipping Label');
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${isBatch ? 'Batch Shipping Labels' : 'Shipping Label'}</h2>
        <p>${description || 'Please find your shipping labels attached to this email.'}</p>
        
        ${trackingCode ? `
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;"><strong>Tracking Number:</strong> ${trackingCode}</p>
          </div>
        ` : ''}
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Attached Files:</h3>
          ${labelsList.map(item => `<p style="margin: 5px 0;">${item}</p>`).join('')}
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          These labels are ready to use for shipping. Please print them on appropriate label stock.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          This email was sent from your shipping management system.
        </p>
      </div>
    `;

    // Convert single email to array if needed
    const emailArray = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];
    
    console.log(`Preparing to send email to ${emailArray.length} recipients with ${attachments.length} attachments`);

    const emailData = {
      from: 'Shipping Labels <onboarding@resend.dev>',
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
