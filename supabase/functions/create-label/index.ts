
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate and set defaults for customs data
const validateCustomsData = (customsData: any) => {
  if (!customsData || !customsData.customs_items || customsData.customs_items.length === 0) {
    throw new Error('Customs items are required for international shipments');
  }

  // Set defaults for required fields
  const validatedCustomsData = {
    contents_type: customsData.contents_type || 'merchandise',
    contents_explanation: customsData.contents_explanation || '',
    customs_certify: customsData.customs_certify !== false, // default to true
    customs_signer: customsData.customs_signer || 'Shipper',
    non_delivery_option: customsData.non_delivery_option || 'return',
    restriction_type: customsData.restriction_type || 'none',
    restriction_comments: customsData.restriction_comments || '',
    eel_pfc: customsData.eel_pfc || 'NOEEI 30.37(a)',
    customs_items: customsData.customs_items.map((item: any) => ({
      description: item.description || 'Item',
      quantity: parseInt(item.quantity) || 1,
      weight: parseFloat(item.weight) || 1,
      value: parseFloat(item.value) || 1,
      hs_tariff_number: item.hs_tariff_number || '',
      origin_country: item.origin_country || 'US'
    }))
  };

  // Validate required fields
  validatedCustomsData.customs_items.forEach((item, index) => {
    if (!item.description || item.description.trim() === '') {
      throw new Error(`Item ${index + 1}: Description is required`);
    }
    if (item.value <= 0) {
      throw new Error(`Item ${index + 1}: Value must be greater than 0`);
    }
    if (item.weight <= 0) {
      throw new Error(`Item ${index + 1}: Weight must be greater than 0`);
    }
  });

  if (!validatedCustomsData.customs_signer || validatedCustomsData.customs_signer.trim() === '') {
    throw new Error('Customs signer name is required');
  }

  return validatedCustomsData;
};

// Validate that return address has phone number for international shipments
const validateReturnAddressPhone = async (shipmentId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Get shipment details to check from_address
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve shipment details');
    }

    const shipment = await response.json();
    
    if (!shipment.from_address || !shipment.from_address.phone) {
      throw new Error('Sender phone number is required for international shipments. Please add a phone number to your return address.');
    }

    console.log(`✅ Return address phone validation passed for shipment ${shipmentId}`);
    return true;
  } catch (error) {
    console.error(`❌ Return address phone validation failed for shipment ${shipmentId}:`, error);
    throw error;
  }
};

// Create CustomsInfo Object in EasyPost
const createCustomsInfoInEasyPost = async (customsData: any): Promise<string> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    // Validate and set defaults for customs data
    const validatedCustomsData = validateCustomsData(customsData);
    
    console.log('Creating CustomsInfo object in EasyPost with validated data:', JSON.stringify(validatedCustomsData, null, 2));
    
    const customsInfoPayload = {
      customs_info: validatedCustomsData
    };

    console.log('Sending CustomsInfo payload to EasyPost:', JSON.stringify(customsInfoPayload, null, 2));

    const response = await fetch('https://api.easypost.com/v2/customs_infos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customsInfoPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create CustomsInfo in EasyPost:', errorData);
      throw new Error(`CustomsInfo creation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const customsInfoResponse = await response.json();
    console.log('✅ Successfully created CustomsInfo in EasyPost with ID:', customsInfoResponse.id);
    return customsInfoResponse.id;
  } catch (error) {
    console.error('Error creating CustomsInfo in EasyPost:', error);
    throw error;
  }
};

// Attach CustomsInfo to Shipment
const attachCustomsInfoToShipment = async (shipmentId: string, customsInfoId: string): Promise<any> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Attaching CustomsInfo ${customsInfoId} to shipment ${shipmentId}`);
    
    const shipmentUpdatePayload = {
      customs_info: {
        id: customsInfoId
      }
    };

    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentUpdatePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to attach CustomsInfo to shipment ${shipmentId}:`, errorData);
      throw new Error(`Shipment update with CustomsInfo failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const updatedShipment = await response.json();
    console.log(`✅ Successfully attached CustomsInfo to shipment ${shipmentId}`);
    return updatedShipment;
  } catch (error) {
    console.error(`Error attaching CustomsInfo to shipment ${shipmentId}:`, error);
    throw error;
  }
};

// Main customs processing workflow
const processCustomsForInternationalShipment = async (shipmentId: string, customsData: any) => {
  try {
    console.log(`🌍 Starting international customs processing for shipment ${shipmentId}`);
    
    // Step 1: Validate return address has phone number
    await validateReturnAddressPhone(shipmentId);
    
    // Step 2: Create CustomsInfo object with validated data
    const customsInfoId = await createCustomsInfoInEasyPost(customsData);
    
    // Step 3: Attach CustomsInfo to shipment
    await attachCustomsInfoToShipment(shipmentId, customsInfoId);
    
    console.log(`✅ International customs processing completed for shipment ${shipmentId}`);
    return { success: true, customsInfoId };
  } catch (error) {
    console.error(`❌ International customs processing failed for shipment ${shipmentId}:`, error);
    throw error;
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
    const { shipmentId, rateId, options = {}, customsInfo } = requestData;
    
    if (!shipmentId || !rateId) {
      console.error('Missing required parameters', { shipmentId, rateId });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);

    // Process customs for international shipments BEFORE purchasing label
    if (customsInfo && customsInfo.customs_items && customsInfo.customs_items.length > 0) {
      try {
        console.log(`🌍 Processing international customs for shipment ${shipmentId}`);
        await processCustomsForInternationalShipment(shipmentId, customsInfo);
      } catch (customsError) {
        console.error('❌ Failed to process international customs:', customsError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process customs information', 
            details: customsError.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Buy the label with EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId }
      }),
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

    // Determine if shipment is international
    const isInternational = customsInfo && customsInfo.customs_items && customsInfo.customs_items.length > 0;

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
      is_international: isInternational,
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
