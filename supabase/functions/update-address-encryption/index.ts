
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
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get request body
    const requestData = await req.json();
    
    const { action, addressId, addressData } = requestData;
    console.log('Request data:', { action, addressId, addressData: { ...addressData, user_id: user.id } });

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
      
      // Ensure user_id is included in the data
      const finalData = {
        ...addressData,
        user_id: user.id
      };
      
      // First, check if user exists in auth.users
      const { data: userData, error: userLookupError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      // If user doesn't exist, create an entry
      if (!userData && !userLookupError) {
        // Insert user into the users table
        await supabaseClient
          .from('users')
          .insert({
            id: user.id,
            email: user.email
          });
      }
      
      // Now create the address record
      const { data, error } = await supabaseClient
        .from('addresses')
        .insert(finalData)
        .select();
      
      if (error) {
        console.error('Database error during insert:', error);
        throw error;
      }
      
      console.log('Address created:', data);
      response = { success: true, data: data[0] };
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
        .select();
      
      if (error) {
        console.error('Database error during update:', error);
        throw error;
      }
      
      console.log('Address updated:', data);
      response = { success: true, data: data[0] };
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
        console.error('Database error during select:', error);
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
      JSON.stringify({ error: 'Internal Server Error', message: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
