
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      toEmails, 
      subject, 
      description, 
      batchResult, 
      selectedFormats = ['pdf'] 
    } = requestBody;

    console.log('Processing email request for:', { toEmails, subject, selectedFormats });

    // Validate required fields
    if (!toEmails || toEmails.length === 0 || !subject) {
      console.error('Missing required fields:', { toEmails, subject });
      return new Response(JSON.stringify({ 
        error: 'Missing required fields', 
        details: 'toEmails and subject are required' 
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

    // Prepare attachments based on selected formats
    const attachments = [];
    const labelsList = [];

    if (batchResult?.consolidatedLabelUrls) {
      for (const format of selectedFormats) {
        if (format === 'scanForm' && batchResult.scanFormUrl) {
          try {
            console.log('Fetching scan form from:', batchResult.scanFormUrl);
            const response = await fetch(batchResult.scanFormUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              attachments.push({
                filename: `pickup_manifest_${Date.now()}.pdf`,
                content: new Uint8Array(buffer),
                contentType: 'application/pdf'
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

        const url = batchResult.consolidatedLabelUrls[format];
        if (url) {
          try {
            console.log(`Fetching ${format} label from:`, url);
            const response = await fetch(url);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const filename = `consolidated_labels_${Date.now()}.${format}`;
              
              attachments.push({
                filename,
                content: new Uint8Array(buffer),
                contentType: format === 'pdf' ? 'application/pdf' : 
                           format === 'zpl' || format === 'epl' ? 'text/plain' : 
                           'image/png'
              });
              
              labelsList.push(`• Consolidated ${format.toUpperCase()} Labels`);
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
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Shipping Labels</h2>
        <p>${description || 'Please find your shipping labels attached to this email.'}</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151;">Attached Files:</h3>
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
    const emailArray = Array.isArray(toEmails) ? toEmails : [toEmails];
    
    console.log(`Preparing to send email to ${emailArray.length} recipients with ${attachments.length} attachments`);

    const emailData = {
      from: 'Shipping System <noreply@yourdomain.com>',
      to: emailArray,
      subject: subject,
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
      emailId: emailResult?.id ?? null,
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
