
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { UPSService } from "../_shared/ups-service.ts";

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

    // Get UPS credentials
    const upsClientId = Deno.env.get('UPS_CLIENT_ID');
    const upsClientSecret = Deno.env.get('UPS_CLIENT_SECRET');
    const upsAccountNumber = Deno.env.get('UPS_ACCOUNT_NUMBER');
    
    if (!upsClientId || !upsClientSecret || !upsAccountNumber) {
      console.error('UPS credentials not configured');
      return new Response(
        JSON.stringify({ error: 'UPS credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData = await req.json();
    const { shipmentData, serviceCode, customsInfo, options = {} } = requestData;
    
    if (!shipmentData || !serviceCode) {
      console.error('Missing required parameters', { shipmentData: !!shipmentData, serviceCode });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating UPS label for service ${serviceCode}`);

    // Create UPS service instance
    const upsService = new UPSService(upsClientId, upsClientSecret, upsAccountNumber, false);
    
    // Create shipment with UPS
    const upsResponse = await upsService.createShipment(shipmentData, serviceCode, customsInfo);
    
    if (!upsResponse.ShipmentResponse) {
      throw new Error('Invalid response from UPS API');
    }

    const shipmentResults = upsResponse.ShipmentResponse.ShipmentResults;
    const trackingNumber = shipmentResults.ShipmentIdentificationNumber;
    const labelUrl = shipmentResults.PackageResults[0]?.ShippingLabel?.GraphicImage;
    
    if (!labelUrl) {
      throw new Error('No label URL received from UPS');
    }

    // Save label to Supabase Storage
    let storedLabelUrl = labelUrl;
    
    try {
      // The UPS label comes as base64, we need to decode it and store it
      const labelResponse = await fetch(`data:application/pdf;base64,${labelUrl}`);
      if (labelResponse.ok) {
        const labelBlob = await labelResponse.blob();
        const safeTrackingNumber = trackingNumber.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `ups_labels/${safeTrackingNumber}_${Date.now()}.pdf`;
        
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
          console.log('UPS label saved to Supabase storage:', storedLabelUrl);
        } else {
          console.error('Failed to upload UPS label to storage:', uploadError);
        }
      }
    } catch (error) {
      console.error('Error saving UPS label to storage:', error);
      // Use the original base64 data URL as fallback
      storedLabelUrl = `data:application/pdf;base64,${labelUrl}`;
    }

    // Save the shipping record in the database
    const shipmentRecord = {
      user_id: user.id,
      shipment_id: `ups_${trackingNumber}`,
      rate_id: `ups_${serviceCode}`,
      tracking_code: trackingNumber,
      label_url: storedLabelUrl,
      status: 'created',
      carrier: 'UPS',
      service: serviceCode,
      delivery_days: null,
      charged_rate: null,
      easypost_rate: null,
      currency: 'USD',
      label_format: options.label_format || "PDF",
      label_size: options.label_size || "4x6",
      is_international: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .insert(shipmentRecord);
      
    if (dbError) {
      console.error('Error saving UPS shipment record:', dbError);
      // Continue anyway as we already have the label
    } else {
      console.log('Successfully saved UPS tracking record for user:', user.id);
    }

    // Also save to tracking_records table
    const trackingRecord = {
      user_id: user.id,
      tracking_code: trackingNumber,
      carrier: 'UPS',
      service: serviceCode,
      status: 'created',
      recipient_name: shipmentData.toAddress?.name || 'Unknown',
      recipient_address: `${shipmentData.toAddress?.city}, ${shipmentData.toAddress?.state} ${shipmentData.toAddress?.zip}`,
      label_url: storedLabelUrl,
      shipment_id: `ups_${trackingNumber}`,
      easypost_id: null
    };

    const { error: trackingError } = await supabaseClient
      .from('tracking_records')
      .insert(trackingRecord);

    if (trackingError) {
      console.error('Failed to save UPS tracking record:', trackingError);
    } else {
      console.log('Successfully saved UPS tracking record');
    }

    // Return the label information
    return new Response(
      JSON.stringify({
        labelUrl: storedLabelUrl,
        trackingCode: trackingNumber,
        shipmentId: `ups_${trackingNumber}`,
        carrier: 'UPS',
        service: serviceCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-ups-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
