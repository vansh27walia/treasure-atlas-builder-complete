
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendLabelsRequest {
  email: string;
  subject: string;
  message: string;
  labelUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  manifestUrl?: string;
  totalLabels: number;
  selectedFormats?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Email service not configured. Please contact support."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const { 
      email, 
      subject, 
      message, 
      labelUrls, 
      manifestUrl, 
      totalLabels,
      selectedFormats = ['pdf']
    }: SendLabelsRequest = await req.json();

    if (!email || !subject) {
      throw new Error("Email and subject are required");
    }

    console.log('Preparing email with selected formats:', selectedFormats);
    console.log('Label URLs:', labelUrls);

    // Prepare attachments based on selected formats
    const attachments = [];
    
    // Add selected label formats as attachments
    for (const format of selectedFormats) {
      if (labelUrls[format as keyof typeof labelUrls]) {
        const labelUrl = labelUrls[format as keyof typeof labelUrls];
        console.log(`Adding ${format.toUpperCase()} attachment:`, labelUrl);
        
        try {
          const response = await fetch(labelUrl);
          if (response.ok) {
            const labelBlob = await response.blob();
            const labelBuffer = await labelBlob.arrayBuffer();
            
            attachments.push({
              filename: `shipping_labels_${Date.now()}.${format}`,
              content: Array.from(new Uint8Array(labelBuffer)),
            });
            console.log(`✅ Successfully added ${format.toUpperCase()} attachment`);
          } else {
            console.warn(`Failed to fetch ${format.toUpperCase()} label:`, response.status);
          }
        } catch (fetchError) {
          console.error(`Error fetching ${format.toUpperCase()} label:`, fetchError);
        }
      }
    }

    // Add manifest if provided
    if (manifestUrl) {
      try {
        const manifestResponse = await fetch(manifestUrl);
        if (manifestResponse.ok) {
          const manifestBlob = await manifestResponse.blob();
          const manifestBuffer = await manifestBlob.arrayBuffer();
          
          attachments.push({
            filename: `pickup_manifest_${Date.now()}.pdf`,
            content: Array.from(new Uint8Array(manifestBuffer)),
          });
          console.log('✅ Successfully added manifest attachment');
        }
      } catch (manifestError) {
        console.error('Error fetching manifest:', manifestError);
      }
    }

    // Build format list for email content
    const availableFormats = Object.keys(labelUrls)
      .filter(format => labelUrls[format as keyof typeof labelUrls])
      .map(format => format.toUpperCase());

    const selectedFormatsList = selectedFormats.map(f => f.toUpperCase()).join(', ');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Your Shipping Labels
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Shipment Summary</h3>
          <p><strong>Total Labels:</strong> ${totalLabels}</p>
          <p><strong>Included Formats:</strong> ${selectedFormatsList}</p>
          <p><strong>Available Formats:</strong> ${availableFormats.join(', ')}</p>
          ${manifestUrl ? '<p><strong>Pickup Manifest:</strong> Included</p>' : ''}
        </div>

        <div style="margin: 20px 0;">
          <p>${message || 'Please find your shipping labels attached to this email.'}</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #1976d2; margin-top: 0;">Printing Instructions:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Use 4x6 inch label paper for PDF/PNG formats</li>
            <li>Print at 100% scale (no scaling)</li>
            <li>Use portrait orientation for PDF/PNG</li>
            <li>For ZPL/EPL: Send directly to compatible thermal printers</li>
            <li>Ensure high quality/best print settings for PDF/PNG</li>
          </ul>
        </div>

        ${selectedFormats.length > 1 ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">Multiple Formats Included:</h4>
          <p style="color: #856404; margin: 0;">
            You've received labels in multiple formats (${selectedFormatsList}). 
            Choose the format that works best with your printer setup.
          </p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
          <p>This email was sent from your shipping management system.</p>
          <p style="font-size: 12px;">If you have any questions, please contact support.</p>
        </div>
      </div>
    `;

    console.log(`Sending email to ${email} with ${attachments.length} attachments`);

    const emailResponse = await resend.emails.send({
      from: "Shipping System <shipping@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log("Email sent successfully:", emailResponse);
    console.log(`Email included ${attachments.length} attachments in formats: ${selectedFormatsList}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Labels sent successfully in ${selectedFormatsList} format(s)`,
      emailId: emailResponse.data?.id,
      attachmentCount: attachments.length,
      formats: selectedFormats
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error sending shipping labels:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
