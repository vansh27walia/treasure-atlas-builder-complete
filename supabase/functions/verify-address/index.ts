
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the input data structure
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

interface VerifyAddressRequest {
  address: AddressData;
  carrier: string;
}

interface VerificationResponse {
  verifiedAddress: AddressData;
  verification: any;
  success: boolean;
  deliverable: boolean;
  messages: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body
    const requestData: VerifyAddressRequest = await req.json();
    
    // Create an address verification request with EasyPost API
    const response = await fetch('https://api.easypost.com/v2/addresses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: {
          name: requestData.address.name,
          company: requestData.address.company,
          street1: requestData.address.street1,
          street2: requestData.address.street2,
          city: requestData.address.city,
          state: requestData.address.state,
          zip: requestData.address.zip,
          country: requestData.address.country,
          phone: requestData.address.phone,
          verify: ['delivery'],
        },
      }),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to verify address', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }
    
    // Process verification results
    let deliverable = true;
    const messages: string[] = [];
    
    if (data.verifications && data.verifications.delivery) {
      const verification = data.verifications.delivery;
      
      if (verification.success === false) {
        deliverable = false;
        
        // Extract error messages
        if (verification.errors && verification.errors.length > 0) {
          verification.errors.forEach((error: any) => {
            messages.push(error.message);
          });
        } else {
          messages.push("Address couldn't be verified");
        }
      }
    }

    const result: VerificationResponse = {
      verifiedAddress: data.address,
      verification: data.verifications,
      success: data.verifications?.delivery?.success ?? false,
      deliverable,
      messages
    };

    // Return the verified address from the response
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-address function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
