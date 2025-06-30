
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const { 
      toEmails, // Now accepting array of emails
      subject, 
      description, 
      batchResult, 
      selectedFormats = ['pdf'] 
    } = await req.json();

    console.log('Email request received:', { toEmails, subject, selectedFormats });

    if (!toEmails || toEmails.length === 0 || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: toEmails and subject' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing');
      return new Response(JSON.stringify({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is missing from backend configuration'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const resend = new Resend(resendApiKey);

    // Prepare attachments based on selected formats
    const attachments = [];
    const labelsList = [];

    if (batchResult?.consolidatedLabelUrls) {
      for (const format of selectedFormats) {
        if (format === 'scanForm' && batchResult.scanFormUrl) {
          try {
            const response = await fetch(batchResult.scanFormUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              attachments.push({
                filename: `pickup_manifest_${Date.now()}.pdf`,
                content: new Uint8Array(buffer),
                contentType: 'application/pdf'
              });
              labelsList.push('• Pickup Manifest (Scan Form)');
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
      return new Response(JSON.stringify({ 
        error: 'No labels available to attach',
        message: 'Unable to fetch any labels for email attachment'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

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
    
    console.log(`Sending email to ${emailArray.length} recipients with ${attachments.length} attachments`);

    const emailData = {
      from: 'Shipping System <noreply@yourdomain.com>', // Fixed sender
      to: emailArray,
      subject: subject,
      html: emailHtml,
      attachments: attachments
    };

    const { data: emailResult, error: emailError } = await resend.emails.send(emailData);

    if (emailError) {
      console.error('Email sending error:', emailError);
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
      emailId: emailResult.id,
      recipientCount: emailArray.length,
      attachmentsCount: attachments.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in email-labels function:', error);
    return new Response(JSON.stringify({
      error: 'Email service error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
