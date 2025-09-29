
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey, // Use service role key to bypass RLS
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

    // Create a helper function to ensure phone field is never null or undefined
    const ensurePhoneField = (data: any) => {
      return { 
        ...data,
        phone: data.phone !== undefined && data.phone !== null ? data.phone : ''
      };
    };

    if (action === 'encrypt') {
      // Handle encryption
      if (!addressData) {
        return new Response(
          JSON.stringify({ error: 'Address data is required for encryption' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Ensure user_id and phone are properly set in the data
      const finalData = ensurePhoneField({
        ...addressData,
        user_id: user.id
      });
      
      // Check if user exists in users table and create if needed - do this in a single operation
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      try {
        // This upsert will create the user if it doesn't exist, or do nothing if it does
        const { error: userUpsertError } = await adminClient
          .from('users')
          .upsert({
            id: user.id,
            email: user.email
          }, { onConflict: 'id' });
        
        if (userUpsertError) {
          console.error('Error ensuring user exists:', userUpsertError);
          // Continue anyway, as the user might already exist
        } else {
          console.log('User record created or verified successfully');
        }
      } catch (userError) {
        console.error('Exception handling user record:', userError);
        // Continue anyway, we'll try to create the address
      }
      
      // Create the address record
      try {
        const { data, error } = await supabaseClient
          .from('addresses')
          .insert(finalData)
          .select();
        
        if (error) {
          console.error('Database error during insert:', error);
          return new Response(
            JSON.stringify({ error: 'Could not save address', details: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        console.log('Address created:', data);
        response = { success: true, data: data[0] };
      } catch (insertError) {
        console.error('Exception during address insert:', insertError);
        return new Response(
          JSON.stringify({ error: 'Exception creating address', details: insertError instanceof Error ? insertError.message : 'Unknown error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } 
    else if (action === 'update') {
      // Handle update with encryption
      if (!addressId || !addressData) {
        return new Response(
          JSON.stringify({ error: 'Address ID and data are required for updates' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Ensure phone field is never null or undefined
      const finalData = ensurePhoneField({
        ...addressData,
        user_id: user.id // Ensure user_id is preserved
      });
      
      // Update the address in the database
      try {
        const { data, error } = await supabaseClient
          .from('addresses')
          .update(finalData)
          .eq('id', addressId)
          .eq('user_id', user.id) // Ensure user can only update their own addresses
          .select();
        
        if (error) {
          console.error('Database error during update:', error);
          return new Response(
            JSON.stringify({ error: 'Could not update address', details: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        console.log('Address updated:', data);
        response = { success: true, data: data[0] };
      } catch (updateError) {
        console.error('Exception during address update:', updateError);
        return new Response(
          JSON.stringify({ error: 'Exception updating address', details: updateError instanceof Error ? updateError.message : 'Unknown error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
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
      try {
        const { data, error } = await supabaseClient
          .from('addresses')
          .select('*')
          .eq('id', addressId)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Database error during select:', error);
          return new Response(
            JSON.stringify({ error: 'Could not retrieve address', details: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        response = { success: true, data };
      } catch (selectError) {
        console.error('Exception during address retrieval:', selectError);
        return new Response(
          JSON.stringify({ error: 'Exception retrieving address', details: selectError instanceof Error ? selectError.message : 'Unknown error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
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
      JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
