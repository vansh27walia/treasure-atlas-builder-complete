
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for label creation for user: ${user.id}`);
    
    const processedLabels = [];
    const failedLabels = [];

    // Process individual labels
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id} for user: ${user.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Purchase the label
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId);

        // Save tracking record to database with user_id
        const shipmentRecord = {
          user_id: user.id,
          shipment_id: shipment.easypost_id,
          rate_id: shipment.selectedRateId,
          tracking_code: labelData.tracking_code,
          label_url: labelData.postage_label?.label_url,
          status: 'created',
          carrier: labelData.selected_rate?.carrier,
          service: labelData.selected_rate?.service,
          delivery_days: labelData.selected_rate?.delivery_days || null,
          charged_rate: labelData.selected_rate?.rate || null,
          easypost_rate: labelData.selected_rate?.rate || null,
          currency: labelData.selected_rate?.currency || 'USD',
          label_format: labelOptions.label_format || "PDF",
          label_size: labelOptions.label_size || "4x6",
          is_international: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: dbError } = await supabaseClient
          .from('shipment_records')
          .insert(shipmentRecord);
          
        if (dbError) {
          console.error('Error saving bulk shipment record:', dbError);
        } else {
          console.log(`Successfully saved tracking record for bulk shipment ${shipment.id}`);
        }

        const processedLabel = {
          ...shipment,
          ...labelData,
          status: 'completed' as const,
          customer_name: labelData.to_address?.name || shipment.details?.to_name || shipment.recipient,
          customer_address: `${labelData.to_address?.street1 || shipment.details?.to_street1}, ${labelData.to_address?.city || shipment.details?.to_city}, ${labelData.to_address?.state || shipment.details?.to_state} ${labelData.to_address?.zip || shipment.details?.to_zip}`,
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

        // Add delay between shipments to avoid rate limiting
        if (i < shipments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
      }
    }

    console.log(`✅ Bulk processing complete for user ${user.id}: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId }
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    
    return boughtShipment;
    
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};
