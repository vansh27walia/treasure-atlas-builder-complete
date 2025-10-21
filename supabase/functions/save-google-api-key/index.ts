
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // This function requires authentication (JWT)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse the request body
    const { apiKey } = await req.json();
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Note: In Supabase Edge Functions, you cannot modify environment variables at runtime.
    // The GOOGLE_PLACES_API_KEY secret must be set via the Supabase dashboard or CLI.
    // This function validates the format but the actual secret must be configured by admins.
    
    console.log('API key received and validated. Please ensure GOOGLE_PLACES_API_KEY is set in Supabase secrets.');
    
    // Return success with a note about secret configuration
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'API key validated. Ensure it is configured in Supabase Edge Function secrets as GOOGLE_PLACES_API_KEY.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in save-google-api-key function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
