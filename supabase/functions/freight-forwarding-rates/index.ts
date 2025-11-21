
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Port/Airport to UN/LOCODE mapping
const portLocationMapping: { [key: string]: string } = {
  // Major US Ports
  'Los Angeles': 'USLAX',
  'Long Beach': 'USLGB',
  'New York': 'USNYC',
  'Newark': 'USEWR',
  'Savannah': 'USSAV',
  'Houston': 'USHOU',
  'Seattle': 'USSEA',
  'Oakland': 'USOAK',
  'Miami': 'USMIA',
  'Charleston': 'USCHS',
  
  // Major International Ports
  'Shanghai': 'CNSHA',
  'Singapore': 'SGSIN',
  'Rotterdam': 'NLRTM',
  'Hamburg': 'DEHAM',
  'Antwerp': 'BEANR',
  'Hong Kong': 'HKHKG',
  'Busan': 'KRPUS',
  'Dubai': 'AEDXB',
  'London': 'GBLON',
  'Tokyo': 'JPNRT',
  'Mumbai': 'INBOM',
  'Delhi': 'INDEL',
  'Chennai': 'INMAA',
  'Kolkata': 'INCCU',
  'Le Havre': 'FRLEH',
  'Felixstowe': 'GBFXT',
  'Barcelona': 'ESBCN',
  'Genoa': 'ITGOA',
  'Valencia': 'ESVLC',
  
  // Major Airports
  'Los Angeles International Airport': 'USLAX',
  'John F. Kennedy International Airport': 'USNYC',
  'Chicago O\'Hare International Airport': 'USCHI',
  'Miami International Airport': 'USMIA',
  'Shanghai Pudong International Airport': 'CNSHA',
  'Singapore Changi Airport': 'SGSIN',
  'Frankfurt Airport': 'DEFRA',
  'Amsterdam Schiphol Airport': 'NLAMS',
  'London Heathrow Airport': 'GBLON',
  'Tokyo Narita International Airport': 'JPNRT',
  'Dubai International Airport': 'AEDXB',
  'Hong Kong International Airport': 'HKHKG',
  'Seoul Incheon International Airport': 'KRPUS',
};

function getUnLocationCode(portName: string): string | null {
  // Direct lookup
  if (portLocationMapping[portName]) {
    return portLocationMapping[portName];
  }
  
  // Try case-insensitive lookup
  const portNameLower = portName.toLowerCase();
  for (const [key, value] of Object.entries(portLocationMapping)) {
    if (key.toLowerCase() === portNameLower) {
      return value;
    }
  }
  
  // Try partial match for airports/ports
  for (const [key, value] of Object.entries(portLocationMapping)) {
    if (key.toLowerCase().includes(portNameLower) || portNameLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Define validation schema
    const LocationSchema = z.object({
      countryCode: z.string().length(2),
      portName: z.string().min(1).max(100)
    });

    const LoadSchema = z.object({
      quantity: z.number().int().positive().max(1000),
      unitType: z.string().min(1).max(50),
      weight: z.number().positive().max(100000),
      totalVolume: z.number().positive().max(10000)
    });

    const LoadDetailsSchema = z.object({
      loads: z.array(LoadSchema).min(1).max(50)
    });

    const FreightRequestSchema = z.object({
      origin: LocationSchema,
      destination: LocationSchema,
      loadDetails: LoadDetailsSchema
    });

    // Parse and validate the request body
    const requestBody = await req.json();
    let validatedData;
    try {
      validatedData = FreightRequestSchema.parse(requestBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error:', validationError.errors);
        return new Response(
          JSON.stringify({ 
            error: 'Validation Error', 
            message: validationError.errors[0].message,
            details: validationError.errors 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      throw validationError;
    }

    const { origin, destination, loadDetails } = validatedData;
    console.log('Freight forwarding request:', { origin, destination, loadDetails });

    // Convert port names to UN/LOCODEs
    const originCode = getUnLocationCode(origin.portName);
    const destinationCode = getUnLocationCode(destination.portName);

    if (!originCode) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid origin port',
          message: `Port "${origin.portName}" is not supported. Please select from the available ports.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!destinationCode) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid destination port',
          message: `Port "${destination.portName}" is not supported. Please select from the available ports.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get Freightos API credentials from Supabase secrets
    const freightApiKey = Deno.env.get('FREIGHTOS_API_KEY');

    if (!freightApiKey) {
      console.error('Missing Freightos API key in Supabase secrets');
      
      return new Response(
        JSON.stringify({ 
          error: 'API credentials not configured',
          message: 'Freightos API key is required to get freight rates.',
          requiresSetup: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Prepare payload for Freightos API based on documentation
    const freightosPayload = {
      load: loadDetails.loads.map((load: any) => ({
        quantity: load.quantity,
        unitType: load.unitType,
        unitWeightKg: load.weight,
        unitVolumeCBM: load.totalVolume,
      })),
      legs: [{
        origin: {
          unLocationCode: originCode,
        },
        destination: {
          unLocationCode: destinationCode,
        },
      }],
    };

    console.log('Calling Freightos API with payload:', freightosPayload);
    console.log('Converted ports:', { 
      origin: `${origin.portName} -> ${originCode}`, 
      destination: `${destination.portName} -> ${destinationCode}` 
    });

    // Call Freightos API
    const freightosResponse = await fetch('https://api.freightos.com/api/v1/freightEstimates', {
      method: 'POST',
      headers: {
        'x-apikey': freightApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(freightosPayload)
    });

    if (!freightosResponse.ok) {
      const errorText = await freightosResponse.text();
      console.error('Freightos API error:', freightosResponse.status, freightosResponse.statusText, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get freight rates',
          message: `API request failed: ${freightosResponse.statusText}`,
          details: errorText,
          statusCode: freightosResponse.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502
        }
      );
    }

    const freightosData = await freightosResponse.json();
    console.log('Freightos API response:', freightosData);

    // Transform Freightos response to our format
    const rates = Object.keys(freightosData).flatMap(mode => {
      return freightosData[mode].priceEstimates ? [{
        mode,
        minPrice: freightosData[mode].priceEstimates.min,
        maxPrice: freightosData[mode].priceEstimates.max,
        minTransitTime: freightosData[mode].transitTime.min,
        maxTransitTime: freightosData[mode].transitTime.max,
        originPort: origin.portName,
        destinationPort: destination.portName,
      }] : [];
    });

    if (rates.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No rates available',
          message: 'No freight rates were returned for this route. Please check your shipment details and try again.',
          rates: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        rates,
        message: `Found ${rates.length} freight rate(s)`,
        source: 'freightos_api',
        routeInfo: {
          origin: `${origin.portName} (${originCode})`,
          destination: `${destination.portName} (${destinationCode})`
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in freight forwarding function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
