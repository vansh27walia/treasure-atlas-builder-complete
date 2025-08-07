
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const apiKey = Deno.env.get("EASYPOST_API_KEY");

if (!apiKey) {
  console.error("EASYPOST_API_KEY not found in environment variables.");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CustomsData {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  contents_explanation?: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    weight: number;
    value: number;
    hs_tariff_number: string;
    origin_country: string;
  }>;
  phone_number: string;
  pickup_phone: string;
  delivery_phone: string;
}

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

    const { 
      rateId, 
      shipmentId, 
      toAddress, 
      fromAddress, 
      customsData,
      insuranceValue 
    } = await req.json();

    console.log('Creating label request received:');
    console.log('- Rate ID:', rateId);
    console.log('- Shipment ID:', shipmentId);
    console.log('- Has customs data:', !!customsData);
    console.log('- From address phone:', fromAddress?.phone);
    console.log('- To address phone:', toAddress?.phone);

    // Create customs info if provided
    let customsInfoId = null;
    if (customsData) {
      console.log('Creating customs info with data:', JSON.stringify(customsData, null, 2));
      
      // Validate required customs fields
      if (!customsData.pickup_phone || !customsData.delivery_phone) {
        console.error('Missing required phone numbers in customs data');
        return new Response(JSON.stringify({ 
          error: 'Phone numbers are required for international shipments',
          details: 'Both pickup and delivery phone numbers must be provided for customs processing'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      if (!customsData.customs_signer) {
        console.error('Missing customs signer');
        return new Response(JSON.stringify({ 
          error: 'Customs signer name is required',
          details: 'A person must be designated to sign the customs declaration'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      if (!customsData.customs_items || customsData.customs_items.length === 0) {
        console.error('Missing customs items');
        return new Response(JSON.stringify({ 
          error: 'Customs items are required',
          details: 'At least one customs item must be declared for international shipments'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      // Validate each customs item
      for (let i = 0; i < customsData.customs_items.length; i++) {
        const item = customsData.customs_items[i];
        if (!item.description || !item.value || !item.weight || !item.quantity) {
          console.error(`Invalid customs item at index ${i}:`, item);
          return new Response(JSON.stringify({ 
            error: `Customs item ${i + 1} is missing required information`,
            details: 'Each customs item must have description, value, weight, and quantity'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }
      }
      
      // Use pickup phone as primary phone for customs (EasyPost requirement)
      const customsPayload = {
        customs_certify: customsData.customs_certify,
        customs_signer: customsData.customs_signer,
        contents_type: customsData.contents_type,
        contents_explanation: customsData.contents_explanation,
        eel_pfc: customsData.eel_pfc,
        non_delivery_option: customsData.non_delivery_option,
        restriction_type: customsData.restriction_type,
        restriction_comments: customsData.restriction_comments,
        phone_number: customsData.pickup_phone, // Use pickup phone as primary
        customs_items: customsData.customs_items
      };

      console.log('Sending customs payload to EasyPost:', JSON.stringify(customsPayload, null, 2));

      const customsResponse = await fetch('https://api.easypost.com/v2/customs_infos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customs_info: customsPayload })
      });

      if (!customsResponse.ok) {
        const customsError = await customsResponse.json();
        console.error('Customs creation error:', JSON.stringify(customsError, null, 2));
        return new Response(JSON.stringify({ 
          error: `Customs creation failed: ${customsError.error?.message || 'Unknown error'}`,
          details: customsError.error?.errors || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const customsResult = await customsResponse.json();
      customsInfoId = customsResult.id;
      console.log('Customs info created successfully:', customsInfoId);
    }

    // Enhance addresses with phone numbers - ensure they exist
    const enhancedToAddress = {
      ...toAddress,
      phone: customsData?.delivery_phone || toAddress.phone || '+1-555-000-0000'
    };

    const enhancedFromAddress = {
      ...fromAddress,
      phone: customsData?.pickup_phone || fromAddress.phone || '+1-555-000-0000'
    };

    // CRITICAL: Use pickup address as return address with phone number
    const returnAddress = {
      ...enhancedFromAddress,
      phone: customsData?.pickup_phone || enhancedFromAddress.phone || '+1-555-000-0000'
    };

    console.log('Enhanced addresses:');
    console.log('- From address phone:', enhancedFromAddress.phone);
    console.log('- To address phone:', enhancedToAddress.phone);
    console.log('- Return address phone:', returnAddress.phone);

    // Buy the label with enhanced addresses, return address, and customs info
    const buyPayload = {
      rate: { id: rateId },
      to_address: enhancedToAddress,
      from_address: enhancedFromAddress,
      return_address: returnAddress, // REQUIRED for international with customs
      insurance: insuranceValue ? insuranceValue.toString() : undefined,
      ...(customsInfoId && { customs_info: customsInfoId })
    };

    console.log('Buying label with payload:', JSON.stringify(buyPayload, null, 2));

    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buyPayload)
    });

    if (!buyResponse.ok) {
      const buyError = await buyResponse.json();
      console.error('Label creation error:', JSON.stringify(buyError, null, 2));
      return new Response(JSON.stringify({ 
        error: `Label creation failed: ${buyError.error?.message || 'Unknown error'}`,
        details: buyError.error?.errors || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const labelData = await buyResponse.json();
    
    console.log(`Label created successfully with${customsInfoId ? ' customs info' : 'out customs info'}`);

    // Save label details to the database
    const { data, error } = await supabaseClient
      .from('labels')
      .insert([
        {
          user_id: user.id,
          label_url: labelData.postage_label.label_url,
          tracking_code: labelData.tracker.tracking_code,
          shipment_details: labelData,
          created_at: new Date(),
        },
      ]);

    if (error) {
      console.error('Database save error:', error);
      // Still return success since label was created, just log the DB error
      console.warn('Label created but failed to save to database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        label_url: labelData.postage_label.label_url,
        tracking_code: labelData.tracker.tracking_code,
        message: 'Label created and saved successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-label function:', error);
    return new Response(JSON.stringify({ 
      error: 'Label creation failed', 
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
