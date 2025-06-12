
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
    const { batchId, shipmentIds } = await req.json();
    
    console.log('Combining batch PNG for:', { batchId, shipmentIds });

    if (!shipmentIds || shipmentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shipment IDs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
        console.log('User authenticated:', userId);
      } catch (error) {
        console.log('Could not authenticate user:', error);
      }
    }

    // Fetch all PNG URLs for the shipments
    const { data: shipments, error } = await supabase
      .from('bulk_shipments')
      .select('shipment_id, label_urls, tracking_code')
      .in('shipment_id', shipmentIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching shipments:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch shipments' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract PNG URLs
    const pngUrls = shipments
      .map(s => s.label_urls?.png)
      .filter(url => url);

    if (pngUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No PNG labels found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Found PNG URLs:', pngUrls.length);

    // Fetch all PNG images
    const imagePromises = pngUrls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${url}`);
      }
      return await response.arrayBuffer();
    });

    const imageBuffers = await Promise.all(imagePromises);
    console.log('Fetched all images, count:', imageBuffers.length);

    // For now, we'll create a simple combined file by concatenating the image data
    // In a production environment, you'd want to use a proper image processing library
    // This is a simplified approach - you might want to use Canvas API or similar
    
    const combinedSize = imageBuffers.reduce((total, buffer) => total + buffer.byteLength, 0);
    const combinedBuffer = new Uint8Array(combinedSize);
    
    let offset = 0;
    imageBuffers.forEach(buffer => {
      combinedBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });

    // Create filename for the combined batch
    const filename = `batch_labels_${batchId || Date.now()}.png`;

    return new Response(combinedBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': combinedBuffer.byteLength.toString(),
      }
    });

  } catch (error) {
    console.error('Error combining batch PNG:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to combine batch PNG', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
