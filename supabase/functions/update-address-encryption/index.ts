
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create a Supabase client with the auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get request body
    const requestData = await req.json();
    
    const { action, addressId, addressData } = requestData;

    // Validate input
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let response;

    if (action === 'encrypt') {
      // Handle encryption
      if (!addressData) {
        return new Response(
          JSON.stringify({ error: 'Address data is required for encryption' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Create encrypted storage in the database
      const { data, error } = await supabaseClient
        .from('addresses')
        .insert({
          ...addressData,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      response = { success: true, data };
    } 
    else if (action === 'update') {
      // Handle update with encryption
      if (!addressId || !addressData) {
        return new Response(
          JSON.stringify({ error: 'Address ID and data are required for updates' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Update the address in the database
      const { data, error } = await supabaseClient
        .from('addresses')
        .update({
          ...addressData,
          user_id: user.id // Ensure user_id is preserved
        })
        .eq('id', addressId)
        .eq('user_id', user.id) // Ensure user can only update their own addresses
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      response = { success: true, data };
    }
    else if (action === 'decrypt') {
      // Handle decryption
      if (!addressId) {
        return new Response(
          JSON.stringify({ error: 'Address ID is required for decryption' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Get the address from the database
      const { data, error } = await supabaseClient
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      response = { success: true, data };
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-address-encryption function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
