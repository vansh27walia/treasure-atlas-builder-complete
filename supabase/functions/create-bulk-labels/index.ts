
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// createClient might not be needed here anymore if this script doesn't directly touch Supabase DB/Storage
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the expected structure for shipments to be sent to the bulk backend
interface ShipmentForBulkBackend {
  id: string; // Your internal client-side ID for correlation
  easypost_id: string;
  selectedRateId: string;
  // Add any other fields that your *main bulk backend* might expect per shipment,
  // based on its `shipmentsFromUser` parameter.
}

// Interface for the payload sent TO THIS SCRIPT
// Let's assume the incoming request to this script provides shipments in a compatible way,
// or we adapt them. The key is that `easypost_id` and `selectedRateId` must be present.
// And your *main bulk backend* also uses an 'id' field in its input `shipmentsFromUser`
// for correlation, so we should ensure that's passed too.
interface IncomingShipmentData {
  id: string; // This should be the client's original ID for the shipment
  easypost_id: string;
  selectedRateId: string;
  details?: any; // Keep other details if needed for other logic, but not for bulk backend
  recipient?: string;
  // ... any other fields your current script receives
}

interface IncomingRequestBody {
  shipments: IncomingShipmentData[];
  labelOptions?: Record<string, any>; // Or a more specific interface if you have one
  // pickupAddress?: any; // Include if your main backend needs it, otherwise remove
}

// URL of your *main* Deno backend function (the first one you provided)
// This is the backend that does the actual bulk processing & uses 'shipping-labels-2'
const YOUR_BULK_LABEL_BACKEND_FUNCTION_URL = 'YOUR_SUPABASE_URL/functions/v1/your-FIRST-bulk-label-backend-name';

/*
// These functions (`purchaseEasyPostLabel`, `downloadAndStoreLabel`) were from your original script.
// If this script's role is now to call your *main bulk backend*, these might no longer be directly used here
// as the main bulk backend will handle the EasyPost interactions and Supabase storage.
// I'm commenting them out for now to reflect this changed role. If you still need them for
// a different purpose, they can be reinstated or adapted.

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, options: any = {}) => { ... };
const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string): Promise<string> => { ... };
*/

serve(async (req: Request) => {
  console.log(`[PROXY_SCRIPT_RECEIVED_REQUEST] Method: ${req.method}, URL: ${req.url}`);

  if (YOUR_BULK_LABEL_BACKEND_FUNCTION_URL.includes('YOUR_SUPABASE_URL') || YOUR_BULK_LABEL_BACKEND_FUNCTION_URL.includes('your-FIRST-bulk-label-backend-name')) {
      console.error("[PROXY_SCRIPT_CONFIG_ERROR] The YOUR_BULK_LABEL_BACKEND_FUNCTION_URL is not configured.");
      return new Response(
        JSON.stringify({ error: 'Proxy script configuration error: Target backend URL not set.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract the Authorization header from the incoming request to this script
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader) {
    // Your main bulk backend requires authentication. If this script doesn't receive
    // an auth token to forward, the call to the main backend will fail.
    console.warn("[PROXY_SCRIPT_AUTH_WARN] No Authorization header received in the request. The call to the main bulk backend will likely fail if it requires authentication.");
    // Depending on your policy, you might want to return a 401 here, or proceed and let the main backend handle it.
    // For now, we'll proceed, but this is a critical point.
    // return new Response(
    //   JSON.stringify({ error: 'Authorization header missing' }),
    //   { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    // );
  }


  try {
    const requestBody: IncomingRequestBody = await req.json();
    console.log("[PROXY_SCRIPT_REQUEST_BODY_PARSED]", JSON.stringify(requestBody));

    if (!requestBody.shipments || !Array.isArray(requestBody.shipments) || requestBody.shipments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or empty shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Transform the incoming shipments data to match the structure expected by your main bulk backend.
    // Your main bulk backend expects an array of objects, each with `id`, `easypost_id`, and `selectedRateId`.
    const shipmentsForBulkPayload: ShipmentForBulkBackend[] = requestBody.shipments.map(s => ({
      id: s.id, // Pass through the client's original shipment ID
      easypost_id: s.easypost_id,
      selectedRateId: s.selectedRateId,
    }));

    const payloadForMainBackend = {
      shipments: shipmentsForBulkPayload,
      labelOptions: requestBody.labelOptions || {}, // Pass through labelOptions
    };

    console.log(`[PROXY_SCRIPT_CALLING_MAIN_BACKEND] Calling ${YOUR_BULK_LABEL_BACKEND_FUNCTION_URL} with payload:`, JSON.stringify(payloadForMainBackend));

    const backendResponse = await fetch(YOUR_BULK_LABEL_BACKEND_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // IMPORTANT: Forward the Authorization header.
        // If `authorizationHeader` is null, this will correctly not add the header.
        ...(authorizationHeader ? { 'Authorization': authorizationHeader } : {}),
        // Add any other headers your main bulk backend might require from this "proxy"
      },
      body: JSON.stringify(payloadForMainBackend),
    });

    const responseData = await backendResponse.json();
    console.log("[PROXY_SCRIPT_RECEIVED_RESPONSE_FROM_MAIN_BACKEND] Status:", backendResponse.status, "Data:", JSON.stringify(responseData));

    // Return the response from the main bulk backend directly to the original caller of this script
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: backendResponse.status, // Use the status from the main backend
    });

  } catch (error) {
    console.error('[PROXY_SCRIPT_ERROR] Error processing request or calling main backend:', error, error.stack);
    let errorMessage = 'An unexpected error occurred in the proxy script.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new Response(
      JSON.stringify({
        error: 'Proxy Script Error',
        message: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});