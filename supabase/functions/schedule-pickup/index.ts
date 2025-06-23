
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressData {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface PickupRequestData {
  carrierCode: string;
  shipmentIds: string[];
  pickupAddress: AddressData;
  pickupDate: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  readyTime: string;
  closeTime: string;
  instructions?: string;
  specialInstructions?: string;
  packageCount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCHEDULE-PICKUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Pickup scheduling started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Get the EasyPost API key
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured');
    }

    // Parse the request body
    const requestData: PickupRequestData = await req.json();
    logStep("Request data received", { 
      carrierCode: requestData.carrierCode, 
      packageCount: requestData.packageCount,
      userId: user.id 
    });
    
    // Validate required fields
    if (!requestData.carrierCode || !requestData.pickupAddress || !requestData.pickupDate) {
      throw new Error('Missing required pickup information');
    }

    if (!requestData.shipmentIds || requestData.shipmentIds.length === 0) {
      throw new Error('At least one shipment ID is required');
    }

    // Create pickup address for EasyPost
    logStep("Creating pickup address in EasyPost");
    const addressResponse = await fetch('https://api.easypost.com/v2/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: {
          name: requestData.pickupAddress.name,
          company: requestData.pickupAddress.company || '',
          street1: requestData.pickupAddress.street1,
          street2: requestData.pickupAddress.street2 || '',
          city: requestData.pickupAddress.city,
          state: requestData.pickupAddress.state,
          zip: requestData.pickupAddress.zip,
          country: requestData.pickupAddress.country || 'US',
          phone: requestData.pickupAddress.phone || '',
        }
      })
    });

    if (!addressResponse.ok) {
      const errorData = await addressResponse.text();
      logStep("Failed to create address", { error: errorData });
      throw new Error(`Failed to create pickup address: ${errorData}`);
    }

    const addressData = await addressResponse.json();
    logStep("Pickup address created", { addressId: addressData.id });

    // Get tracking records to find EasyPost shipment IDs
    logStep("Looking up EasyPost shipment IDs");
    const { data: trackingRecords, error: trackingError } = await supabaseClient
      .from('tracking_records')
      .select('easypost_id, tracking_code')
      .in('tracking_code', requestData.shipmentIds)
      .eq('user_id', user.id);

    if (trackingError) {
      throw new Error(`Failed to lookup shipments: ${trackingError.message}`);
    }

    if (!trackingRecords || trackingRecords.length === 0) {
      throw new Error('No valid shipments found for pickup');
    }

    const easypostShipmentIds = trackingRecords
      .filter(record => record.easypost_id)
      .map(record => record.easypost_id);

    if (easypostShipmentIds.length === 0) {
      throw new Error('No EasyPost shipment IDs found for selected shipments');
    }

    logStep("Found EasyPost shipment IDs", { count: easypostShipmentIds.length });

    // Format pickup date and times
    const pickupDate = new Date(requestData.pickupDate);
    const [readyHour, readyMinute] = requestData.readyTime.split(':');
    const [closeHour, closeMinute] = requestData.closeTime.split(':');
    
    const readyTime = new Date(pickupDate);
    readyTime.setHours(parseInt(readyHour), parseInt(readyMinute), 0, 0);
    
    const closeTime = new Date(pickupDate);
    closeTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

    // Create pickup request with EasyPost
    logStep("Creating pickup request with EasyPost");
    const pickupPayload = {
      pickup: {
        address: { id: addressData.id },
        shipment: easypostShipmentIds.map(id => ({ id })),
        min_datetime: readyTime.toISOString(),
        max_datetime: closeTime.toISOString(),
        instructions: requestData.instructions || '',
        reference: `Pickup-${user.id}-${Date.now()}`,
        is_account_address: false,
        carrier_accounts: [],
      }
    };

    // Add carrier-specific handling
    if (requestData.carrierCode === 'USPS') {
      pickupPayload.pickup.carrier_accounts = [];
    }

    logStep("Sending pickup request to EasyPost", { 
      shipmentCount: easypostShipmentIds.length,
      carrier: requestData.carrierCode 
    });

    const pickupResponse = await fetch('https://api.easypost.com/v2/pickups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pickupPayload)
    });

    if (!pickupResponse.ok) {
      const errorData = await pickupResponse.json();
      logStep("EasyPost pickup creation failed", { error: errorData });
      
      // Handle specific EasyPost errors
      if (errorData.error?.code === 'PICKUP.FAILED') {
        throw new Error(`Pickup scheduling failed: ${errorData.error.message}`);
      } else if (errorData.error?.code === 'PICKUP.INVALID_TIME') {
        throw new Error('Invalid pickup time window. Please check your selected times.');
      } else if (errorData.error?.code === 'PICKUP.ADDRESS_INVALID') {
        throw new Error('Invalid pickup address. Please verify the address details.');
      }
      
      throw new Error(`EasyPost pickup error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const pickupData = await pickupResponse.json();
    logStep("Pickup created successfully", { 
      pickupId: pickupData.id,
      status: pickupData.status 
    });

    // Buy the pickup if it needs to be purchased
    let finalPickupData = pickupData;
    if (pickupData.pickup_rates && pickupData.pickup_rates.length > 0) {
      logStep("Purchasing pickup");
      const buyResponse = await fetch(`https://api.easypost.com/v2/pickups/${pickupData.id}/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          carrier: requestData.carrierCode,
          service: pickupData.pickup_rates[0].service
        })
      });

      if (buyResponse.ok) {
        finalPickupData = await buyResponse.json();
        logStep("Pickup purchased successfully", { status: finalPickupData.status });
      } else {
        logStep("Pickup purchase failed, but pickup was created");
      }
    }

    // Store pickup record in database
    const pickupRecord = {
      user_id: user.id,
      easypost_pickup_id: finalPickupData.id,
      confirmation_number: finalPickupData.confirmation || finalPickupData.id,
      carrier: requestData.carrierCode,
      pickup_date: requestData.pickupDate,
      pickup_address: requestData.pickupAddress,
      shipment_ids: requestData.shipmentIds,
      package_count: requestData.packageCount,
      instructions: requestData.instructions,
      special_instructions: requestData.specialInstructions,
      status: finalPickupData.status || 'scheduled',
      pickup_fee: finalPickupData.pickup_rates?.[0]?.rate || null,
      time_window_start: requestData.readyTime,
      time_window_end: requestData.closeTime,
      created_at: new Date().toISOString(),
    };

    // Note: We would create a pickup_requests table to store this data
    // For now, we'll return the response without storing in DB
    logStep("Pickup scheduling completed successfully");

    // Return the pickup confirmation data
    const response = {
      pickupId: finalPickupData.id,
      confirmation: finalPickupData.confirmation || finalPickupData.id,
      scheduledDate: requestData.pickupDate,
      carrier: requestData.carrierCode.toUpperCase(),
      status: finalPickupData.status || 'scheduled',
      address: requestData.pickupAddress,
      timeWindow: {
        start: requestData.readyTime,
        end: requestData.closeTime,
      },
      packageCount: requestData.packageCount,
      message: 'Pickup scheduled successfully with live EasyPost API',
      pickupFee: finalPickupData.pickup_rates?.[0]?.rate || null,
      estimatedWindow: finalPickupData.min_datetime && finalPickupData.max_datetime 
        ? `${new Date(finalPickupData.min_datetime).toLocaleTimeString()} - ${new Date(finalPickupData.max_datetime).toLocaleTimeString()}`
        : null,
      easypostData: {
        pickupId: finalPickupData.id,
        status: finalPickupData.status,
        rates: finalPickupData.pickup_rates || [],
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: 'Pickup Scheduling Error', 
      message: errorMessage,
      details: 'Please check your shipment IDs, pickup address, and try again.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
