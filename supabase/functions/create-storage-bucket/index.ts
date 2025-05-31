
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the shipping-labels-2 bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list buckets' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'shipping-labels-2');
    
    if (!bucketExists) {
      const { data: createData, error: createError } = await supabase.storage.createBucket('shipping-labels-2', {
        public: true,
        allowedMimeTypes: ['application/pdf', 'image/png', 'application/x-zpl'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create bucket' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Created shipping-labels-2 bucket');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Storage bucket ready' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-storage-bucket function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Storage Setup Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
