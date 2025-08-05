
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    const { shipmentId, rateId, options = {}, customsInfo = null } = requestData;
    
    if (!shipmentId || !rateId) {
      console.error('Missing required parameters', { shipmentId, rateId });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    if (customsInfo) {
      console.log(`Including customs information for international shipment`);
    }

    // Prepare the request body for EasyPost
    const requestBody: any = {
      rate: { id: rateId }
    };

    // Add customs information if provided (for international shipments)
    if (customsInfo) {
      requestBody.customs_info = {
        contents_type: customsInfo.contents_type,
        contents_explanation: customsInfo.contents_explanation || '',
        customs_certify: customsInfo.customs_certify,
        customs_signer: customsInfo.customs_signer,
        non_delivery_option: customsInfo.non_delivery_option,
        restriction_type: customsInfo.restriction_type || 'none',
        restriction_comments: customsInfo.restriction_comments || '',
        eel_pfc: customsInfo.eel_pfc || '',
        customs_items: customsInfo.customs_items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          value: item.value,
          weight: item.weight,
          hs_tariff_number: item.hs_tariff_number || '',
          origin_country: item.origin_country || 'US'
        }))
      };
    }

    // Buy the label with EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to create label', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Save label to Supabase Storage
    let storedLabelUrl = data.postage_label?.label_url;
    
    if (data.postage_label?.label_url) {
      try {
        // Fetch the label from EasyPost
        const labelResponse = await fetch(data.postage_label.label_url);
        if (labelResponse.ok) {
          const labelBlob = await labelResponse.blob();
          const safeTrackingCode = data.tracking_code ? data.tracking_code.replace(/[^a-zA-Z0-9]/g, '_') : `shipment_${shipmentId}`;
          const fileName = `labels/${safeTrackingCode}_${shipmentId}.pdf`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabaseClient.storage
            .from('shipping-labels')
            .upload(fileName, labelBlob, {
              contentType: 'application/pdf',
              upsert: true
            });
          
          if (!uploadError) {
            // Get the public URL from Supabase
            const { data: urlData } = supabaseClient.storage
              .from('shipping-labels')
              .getPublicUrl(fileName);
            
            storedLabelUrl = urlData.publicUrl;
            console.log('Label saved to Supabase storage:', storedLabelUrl);
          } else {
            console.error('Failed to upload label to storage:', uploadError);
          }
        }
      } catch (error) {
        console.error('Error saving label to storage:', error);
      }
    }

    // Save the shipping record in the database with user_id
    const shipmentRecord = {
      user_id: user.id,
      shipment_id: shipmentId,
      rate_id: rateId,
      tracking_code: data.tracking_code,
      label_url: storedLabelUrl,
      status: 'created',
      carrier: data.selected_rate?.carrier,
      service: data.selected_rate?.service,
      delivery_days: data.selected_rate?.delivery_days || null,
      charged_rate: data.selected_rate?.rate || null,
      easypost_rate: data.selected_rate?.rate || null,
      currency: data.selected_rate?.currency || 'USD',
      label_format: options.label_format || "PDF",
      label_size: options.label_size || "4x6",
      is_international: !!customsInfo,
      customs_data: customsInfo ? JSON.stringify(customsInfo) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .insert(shipmentRecord);
      
    if (dbError) {
      console.error('Error saving shipment record:', dbError);
      // Continue anyway as we already have the label
    } else {
      console.log('Successfully saved tracking record for user:', user.id);
    }

    // Also save to tracking_records table
    if (data.tracking_code) {
      const trackingRecord = {
        user_id: user.id,
        tracking_code: data.tracking_code,
        carrier: data.selected_rate?.carrier || 'Unknown',
        service: data.selected_rate?.service || 'Standard',
        status: 'created',
        recipient_name: 'Unknown',
        recipient_address: 'Unknown',
        label_url: storedLabelUrl,
        shipment_id: shipmentId,
        easypost_id: shipmentId
      };

      const { error: trackingError } = await supabaseClient
        .from('tracking_records')
        .insert(trackingRecord);

      if (trackingError) {
        console.error('Failed to save tracking record:', trackingError);
      } else {
        console.log('Successfully saved tracking record');
      }
    }

    // Return the label information with Supabase URL
    return new Response(
      JSON.stringify({
        labelUrl: storedLabelUrl,
        trackingCode: data.tracking_code,
        shipmentId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
