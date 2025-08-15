
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PDF manipulation utility using jsPDF-like approach
const generateFormattedPDF = async (originalPdfUrl: string, format: string): Promise<Uint8Array> => {
  // Fetch the original PDF
  const pdfResponse = await fetch(originalPdfUrl);
  if (!pdfResponse.ok) {
    throw new Error('Failed to fetch original PDF');
  }
  
  const originalPdfBuffer = await pdfResponse.arrayBuffer();
  
  // For now, we'll return the original PDF for 4x6 format
  // In a production environment, you would use a PDF manipulation library
  // like pdf-lib to create the different layouts
  
  switch (format) {
    case '4x6':
      return new Uint8Array(originalPdfBuffer);
    
    case '8.5x11-left':
    case '8.5x11-top':
    case '8.5x11-two':
      // For demonstration, we'll return the original PDF
      // In production, you would manipulate the PDF to create the requested layout
      return new Uint8Array(originalPdfBuffer);
    
    default:
      return new Uint8Array(originalPdfBuffer);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Create a Supabase client with user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Parse request parameters
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || '4x6';
    const labelUrl = url.searchParams.get('labelUrl');
    const shipmentId = url.searchParams.get('shipmentId');

    if (!labelUrl && !shipmentId) {
      return new Response(JSON.stringify({ error: 'Label URL or Shipment ID required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let finalLabelUrl = labelUrl;

    // If shipmentId is provided, get the label URL from the database
    if (shipmentId && !labelUrl) {
      const { data: shipmentRecord, error: recordError } = await supabaseClient
        .from('shipment_records')
        .select('label_url')
        .eq('shipment_id', shipmentId)
        .eq('user_id', user.id)
        .single();

      if (recordError || !shipmentRecord?.label_url) {
        return new Response(JSON.stringify({ error: 'Shipment record not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        });
      }

      finalLabelUrl = shipmentRecord.label_url;
    }

    if (!finalLabelUrl) {
      return new Response(JSON.stringify({ error: 'Label URL not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    console.log(`Generating ${format} format for label: ${finalLabelUrl}`);

    // Generate the formatted PDF
    const pdfBuffer = await generateFormattedPDF(finalLabelUrl, format);

    // Determine filename based on format
    const formatNames = {
      '4x6': '4x6-shipping-label',
      '8.5x11-left': '8.5x11-left-side-label',
      '8.5x11-top': '8.5x11-top-half-label',
      '8.5x11-two': '8.5x11-two-labels'
    };

    const filename = `${formatNames[format as keyof typeof formatNames] || 'shipping-label'}.pdf`;

    // Return the PDF as a download
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in generate-label-format function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
