
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
  console.log(`[PICKUP-SCHEDULER] ${step}${detailsStr}`);
};

const validatePickupRequest = (requestData: PickupRequestData) => {
  const errors: string[] = [];
  
  if (!requestData.carrierCode) errors.push('Carrier code is required');
  if (!requestData.pickupAddress) errors.push('Pickup address is required');
  if (!requestData.pickupDate) errors.push('Pickup date is required');
  if (!requestData.readyTime) errors.push('Ready time is required');
  if (!requestData.closeTime) errors.push('Close time is required');
  if (!requestData.shipmentIds || requestData.shipmentIds.length === 0) {
    errors.push('At least one shipment ID is required');
  }
  
  // Validate address fields
  if (requestData.pickupAddress) {
    if (!requestData.pickupAddress.street1) errors.push('Street address is required');
    if (!requestData.pickupAddress.city) errors.push('City is required');
    if (!requestData.pickupAddress.state) errors.push('State is required');
    if (!requestData.pickupAddress.zip) errors.push('ZIP code is required');
  }
  
  return errors;
};

const createEasyPostAddress = async (address: AddressData, apiKey: string) => {
  logStep("Creating EasyPost address", { street1: address.street1, city: address.city });
  
  const addressResponse = await fetch('https://api.easypost.com/v2/addresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      address: {
        name: address.name || 'Pickup Address',
        company: address.company || '',
        street1: address.street1,
        street2: address.street2 || '',
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || 'US',
        phone: address.phone || '',
      }
    })
  });

  if (!addressResponse.ok) {
    const errorData = await addressResponse.text();
    logStep("Failed to create EasyPost address", { error: errorData });
    throw new Error(`Failed to create pickup address: ${errorData}`);
  }

  const addressData = await addressResponse.json();
  logStep("EasyPost address created successfully", { addressId: addressData.id });
  return addressData;
};

const createEasyPostPickup = async (
  addressData: any, 
  easypostShipmentIds: string[], 
  requestData: PickupRequestData, 
  apiKey: string
) => {
  logStep("Creating EasyPost pickup", { 
    shipmentCount: easypostShipmentIds.length,
    carrier: requestData.carrierCode 
  });

  // Format pickup times
  const pickupDate = new Date(requestData.pickupDate);
  const [readyHour, readyMinute] = requestData.readyTime.split(':');
  const [closeHour, closeMinute] = requestData.closeTime.split(':');
  
  const readyTime = new Date(pickupDate);
  readyTime.setHours(parseInt(readyHour), parseInt(readyMinute), 0, 0);
  
  const closeTime = new Date(pickupDate);
  closeTime.setHours(parseInt(closeHour), parseInt(closeMinute), 0, 0);

  const pickupPayload = {
    pickup: {
      address: { id: addressData.id },
      shipment: easypostShipmentIds.map(id => ({ id })),
      min_datetime: readyTime.toISOString(),
      max_datetime: closeTime.toISOString(),
      instructions: requestData.instructions || '',
      reference: `Pickup-${Date.now()}`,
      is_account_address: false,
    }
  };

  logStep("Sending pickup request to EasyPost", pickupPayload);

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
    
    // Handle specific EasyPost errors with user-friendly messages
    if (errorData.error?.code === 'PICKUP.FAILED') {
      throw new Error(`Pickup scheduling failed: ${errorData.error.message}`);
    } else if (errorData.error?.code === 'PICKUP.INVALID_TIME') {
      throw new Error('Invalid pickup time window. Please check your selected times.');
    } else if (errorData.error?.code === 'PICKUP.ADDRESS_INVALID') {
      throw new Error('Invalid pickup address. Please verify the address details.');
    } else if (errorData.error?.message?.includes('shipment')) {
      throw new Error('Invalid shipment data. Please ensure all shipments are valid for pickup.');
    }
    
    throw new Error(`Pickup creation failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const pickupData = await pickupResponse.json();
  logStep("Pickup created successfully", { 
    pickupId: pickupData.id,
    status: pickupData.status 
  });

  return pickupData;
};

const purchasePickup = async (pickupData: any, requestData: PickupRequestData, apiKey: string) => {
  // Try to purchase the pickup if it has rates
  let finalPickupData = pickupData;
  
  if (pickupData.pickup_rates && pickupData.pickup_rates.length > 0) {
    logStep("Attempting to purchase pickup", { 
      pickupId: pickupData.id,
      ratesCount: pickupData.pickup_rates.length 
    });
    
    try {
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
        logStep("Pickup purchased successfully", { 
          status: finalPickupData.status,
          confirmation: finalPickupData.confirmation 
        });
      } else {
        const errorData = await buyResponse.json();
        logStep("Pickup purchase failed, but pickup was created", { error: errorData });
      }
    } catch (purchaseError) {
      logStep("Pickup purchase error, but pickup was created", { error: purchaseError });
    }
  }
  
  return finalPickupData;
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
      throw new Error("Authentication required");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error("Invalid authentication");
    }

    // Get the EasyPost API key
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      throw new Error('EasyPost API key not configured. Please contact support.');
    }

    // Parse and validate request data
    const requestData: PickupRequestData = await req.json();
    logStep("Request data received", { 
      carrierCode: requestData.carrierCode, 
      packageCount: requestData.packageCount,
      userId: user.id 
    });
    
    // Validate the request
    const validationErrors = validatePickupRequest(requestData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Create pickup address in EasyPost
    const addressData = await createEasyPostAddress(requestData.pickupAddress, apiKey);

    // Get tracking records to find EasyPost shipment IDs
    logStep("Looking up EasyPost shipment IDs");
    const { data: trackingRecords, error: trackingError } = await supabaseClient
      .from('tracking_records')
      .select('easypost_id, tracking_code, status')
      .in('tracking_code', requestData.shipmentIds)
      .eq('user_id', user.id);

    if (trackingError) {
      throw new Error(`Failed to lookup shipments: ${trackingError.message}`);
    }

    if (!trackingRecords || trackingRecords.length === 0) {
      throw new Error('No valid shipments found for pickup. Please ensure you have created shipping labels first.');
    }

    // Filter for valid shipments with EasyPost IDs
    const validShipments = trackingRecords.filter(record => 
      record.easypost_id && record.status === 'created'
    );

    if (validShipments.length === 0) {
      throw new Error('No valid shipments found for pickup. Shipments must have valid EasyPost IDs and be in "created" status.');
    }

    const easypostShipmentIds = validShipments.map(record => record.easypost_id);
    logStep("Found valid EasyPost shipment IDs", { count: easypostShipmentIds.length });

    // Create pickup request with EasyPost
    const pickupData = await createEasyPostPickup(
      addressData, 
      easypostShipmentIds, 
      requestData, 
      apiKey
    );

    // Purchase the pickup if possible
    const finalPickupData = await purchasePickup(pickupData, requestData, apiKey);

    // Store pickup record in database (optional - for future pickup history feature)
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

    logStep("Pickup scheduling completed successfully", {
      pickupId: finalPickupData.id,
      shipmentsCount: validShipments.length
    });

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
      message: `Pickup scheduled successfully with ${requestData.carrierCode}`,
      pickupFee: finalPickupData.pickup_rates?.[0]?.rate || null,
      estimatedWindow: finalPickupData.min_datetime && finalPickupData.max_datetime 
        ? `${new Date(finalPickupData.min_datetime).toLocaleTimeString()} - ${new Date(finalPickupData.max_datetime).toLocaleTimeString()}`
        : null,
      shipmentsProcessed: validShipments.length,
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
      error: 'Pickup Scheduling Failed', 
      message: errorMessage,
      details: 'Please check your shipment details and try again. Ensure you have created shipping labels first.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
