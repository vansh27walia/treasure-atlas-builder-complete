
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create CustomsInfo Object in EasyPost
const createCustomsInfoInEasyPost = async (customsData: any): Promise<string> => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log('Creating CustomsInfo object for batch shipment:', JSON.stringify(customsData, null, 2));
    
    const customsInfoPayload = {
      customs_info: {
        customs_certify: customsData.customs_certify !== false,
        customs_signer: customsData.customs_signer || 'Shipper',
        contents_type: customsData.contents_type || 'merchandise',
        contents_explanation: customsData.contents_explanation || '',
        eel_pfc: customsData.eel_pfc || 'NOEEI 30.37(a)',
        non_delivery_option: customsData.non_delivery_option || 'return',
        restriction_type: customsData.restriction_type || 'none',
        restriction_comments: customsData.restriction_comments || '',
        customs_items: customsData.customs_items?.map((item: any) => ({
          description: item.description || 'Item',
          quantity: parseInt(item.quantity) || 1,
          weight: parseFloat(item.weight) || 1,
          value: parseFloat(item.value) || 1,
          hs_tariff_number: item.hs_tariff_number || '',
          origin_country: item.origin_country || 'US'
        })) || []
      }
    };

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
    console.log('✅ Successfully created CustomsInfo with ID:', customsInfoResponse.id);
    return customsInfoResponse.id;
  } catch (error) {
    console.error('Error creating CustomsInfo in EasyPost:', error);
    throw error;
  }
};

// Process individual shipment with customs
const processShipmentWithCustoms = async (shipment: any, supabaseClient: any, userId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Processing shipment ${shipment.id} with customs info`);

    let customsInfoId = null;

    // Create customs info if it's international
    if (shipment.customs_info && shipment.customs_info.customs_items && shipment.customs_info.customs_items.length > 0) {
      customsInfoId = await createCustomsInfoInEasyPost(shipment.customs_info);
      console.log(`Created customs info ${customsInfoId} for shipment ${shipment.id}`);

      // Attach customs info to the EasyPost shipment
      const updateResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customs_info: { id: customsInfoId }
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to attach customs info: ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    // Buy the label
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rate: { id: shipment.selectedRateId }
      })
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      throw new Error(`Failed to buy label: ${errorData.error?.message || 'Unknown error'}`);
    }

    const labelData = await buyResponse.json();

    // Save label to Supabase Storage
    let storedLabelUrl = labelData.postage_label?.label_url;
    
    if (labelData.postage_label?.label_url) {
      try {
        const labelResponse = await fetch(labelData.postage_label.label_url);
        if (labelResponse.ok) {
          const labelBlob = await labelResponse.blob();
          const safeTrackingCode = labelData.tracking_code ? labelData.tracking_code.replace(/[^a-zA-Z0-9]/g, '_') : `batch_${shipment.id}`;
          const fileName = `batch_labels/${safeTrackingCode}_${shipment.id}.pdf`;
          
          const { error: uploadError } = await supabaseClient.storage
            .from('shipping-labels')
            .upload(fileName, labelBlob, {
              contentType: 'application/pdf',
              upsert: true
            });
          
          if (!uploadError) {
            const { data: urlData } = supabaseClient.storage
              .from('shipping-labels')
              .getPublicUrl(fileName);
            storedLabelUrl = urlData.publicUrl;
          }
        }
      } catch (error) {
        console.error('Error saving label to storage:', error);
      }
    }

    // Save shipment record
    const shipmentRecord = {
      user_id: userId,
      shipment_id: shipment.easypost_id,
      rate_id: shipment.selectedRateId,
      tracking_code: labelData.tracking_code,
      label_url: storedLabelUrl,
      status: 'created',
      carrier: labelData.selected_rate?.carrier,
      service: labelData.selected_rate?.service,
      delivery_days: labelData.selected_rate?.delivery_days || null,
      charged_rate: labelData.selected_rate?.rate || null,
      easypost_rate: labelData.selected_rate?.rate || null,
      currency: labelData.selected_rate?.currency || 'USD',
      label_format: "PDF",
      label_size: "4x6",
      is_international: !!customsInfoId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabaseClient
      .from('shipment_records')
      .insert(shipmentRecord);
      
    if (dbError) {
      console.error('Error saving shipment record:', dbError);
    }

    return {
      success: true,
      shipment_id: shipment.id,
      tracking_code: labelData.tracking_code,
      label_url: storedLabelUrl,
      customs_info_id: customsInfoId
    };

  } catch (error) {
    console.error(`Error processing shipment ${shipment.id}:`, error);
    return {
      success: false,
      shipment_id: shipment.id,
      error: error.message
    };
  }
};

serve(async (req) => {
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

    const { shipments } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for bulk label creation with customs`);

    // Process all shipments
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const shipment of shipments) {
      console.log(`Processing shipment ${shipment.id}...`);
      const result = await processShipmentWithCustoms(shipment, supabaseClient, user.id);
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
      
      results.push(result);
    }

    console.log(`Bulk processing complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        total: shipments.length,
        successful,
        failed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels-with-customs function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
