
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, subject, message, labelUrls, manifestUrl, totalLabels }: SendLabelsRequest = await req.json();

    if (!email || !subject) {
      throw new Error("Email and subject are required");
    }

    // Prepare attachments
    const attachments = [];
    
    if (labelUrls.pdf) {
      attachments.push({
        filename: `shipping_labels_${Date.now()}.pdf`,
        content: labelUrls.pdf,
      });
    }

    if (manifestUrl) {
      attachments.push({
        filename: `pickup_manifest_${Date.now()}.pdf`,
        content: manifestUrl,
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          Your Shipping Labels
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Shipment Summary</h3>
          <p><strong>Total Labels:</strong> ${totalLabels}</p>
          <p><strong>Formats Available:</strong> ${Object.keys(labelUrls).join(', ').toUpperCase()}</p>
          ${manifestUrl ? '<p><strong>Pickup Manifest:</strong> Included</p>' : ''}
        </div>

        <div style="margin: 20px 0;">
          <p>${message || 'Please find your shipping labels attached to this email.'}</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #1976d2; margin-top: 0;">Printing Instructions:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Use 4x6 inch label paper</li>
            <li>Print at 100% scale (no scaling)</li>
            <li>Use portrait orientation</li>
            <li>Ensure high quality/best print settings</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
          <p>This email was sent from your shipping management system.</p>
          <p style="font-size: 12px;">If you have any questions, please contact support.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Shipping System <shipping@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Labels sent successfully",
      emailId: emailResponse.data?.id
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
