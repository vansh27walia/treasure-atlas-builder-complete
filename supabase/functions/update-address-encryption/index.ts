
// Follow Deno/Oak conventions for edge functions
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface AddressData {
  // Define the address data structure
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  is_default_from?: boolean;
  is_default_to?: boolean;
  user_id?: string;
  id?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, addressId, addressData } = await req.json();

    // Get user ID from the request authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract just the token part (remove 'Bearer ')
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error retrieving user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Ensure the user_id is set correctly
    const userId = user.id;

    let result;
    
    if (action === 'encrypt') {
      // Create new address
      const data: AddressData = {
        ...addressData,
        user_id: userId,
      };

      const { data: insertedData, error } = await supabase
        .from('addresses')
        .insert(data)
        .select();

      if (error) {
        throw error;
      }

      result = insertedData?.[0];
      
      console.log("Created encrypted address:", result);
    } else if (action === 'update') {
      // First verify that the address belongs to the user
      const { data: existingAddress, error: fetchError } = await supabase
        .from('addresses')
        .select('id, user_id')
        .eq('id', addressId)
        .eq('user_id', userId)
        .single();
        
      if (fetchError || !existingAddress) {
        return new Response(
          JSON.stringify({ error: 'Address not found or you do not have permission to update it' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Update the address
      const { data: updatedData, error } = await supabase
        .from('addresses')
        .update({
          ...addressData,
          user_id: userId // Ensure user_id remains unchanged
        })
        .eq('id', addressId)
        .select();

      if (error) {
        throw error;
      }

      result = updatedData?.[0];
      
      console.log("Updated encrypted address:", result);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-address-encryption function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
