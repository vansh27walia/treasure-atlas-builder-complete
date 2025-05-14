
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
    // Get the EasyPost API key from Supabase secrets
    const apiKey = Deno.env.get('EASYPOST_API_KEY');
    if (!apiKey) {
      console.error('API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration not found');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json();
    const { shipmentId, rateId, options = {} } = requestData;
    
    if (!shipmentId || !rateId) {
      console.error('Missing required parameters', { shipmentId, rateId });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    console.log(`Label options:`, options);

    try {
      // Check if storage bucket exists, create if not
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .listBuckets();
      
      const bucketExists = bucketData?.some(bucket => bucket.name === 'shipping-labels');
      
      if (!bucketExists) {
        console.log('Creating shipping-labels bucket');
        const { error } = await supabase
          .storage
          .createBucket('shipping-labels', {
            public: true,  // Make public to facilitate direct downloads
            fileSizeLimit: 10485760, // 10MB limit for label files
          });
          
        if (error) {
          console.error('Error creating bucket:', error);
          throw new Error('Failed to create storage bucket');
        }
      }
    } catch (bucketError) {
      console.error('Error checking/creating bucket:', bucketError);
      // Continue anyway, the bucket might exist but we might not have permission to list buckets
    }

    // Create request body for EasyPost with label format options
    const buyOptions = {
      rate: { id: rateId }
    };
    
    // If label format and size are specified, add them to the request
    if (options.label_format || options.label_size) {
      // Always request PDF format for consistency
      buyOptions.label_format = "PDF";
      buyOptions.label_size = options.label_size || "4x6";
    }

    // Buy the label with EasyPost API
    const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(buyOptions),
    });

    const data = await response.json();
    
    // Check for API errors
    if (!response.ok) {
      console.error('EasyPost API error:', JSON.stringify(data, null, 2));
      
      // If postage already exists, try to get the existing label
      if (data.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log('Postage already exists, retrieving existing label');
        
        // Get the shipment details to get the label URL
        const shipmentResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!shipmentResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve existing shipment', details: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        
        const shipmentData = await shipmentResponse.json();
        if (shipmentData.postage_label?.label_url) {
          // We got the existing label URL, download and save to Storage
          const labelURL = shipmentData.postage_label.label_url;
          try {
            // Force PDF format for the download
            const pdfLabelURL = labelURL.replace(/\.(\w+)$/, '.pdf');
            console.log(`Converting label URL to PDF: ${pdfLabelURL}`);
            
            const labelResponse = await fetch(pdfLabelURL, {
              headers: {
                'Accept': 'application/pdf'
              }
            });

            if (!labelResponse.ok) {
              console.error(`Failed to download PDF label: ${labelResponse.status}`);
              throw new Error('Failed to download existing label in PDF format');
            }
            
            const labelBlob = await labelResponse.blob();
            const labelArrayBuffer = await labelBlob.arrayBuffer();
            const labelBuffer = new Uint8Array(labelArrayBuffer);
            
            // Generate a unique filename for the label
            const fileName = `label_${shipmentId}_${Date.now()}.pdf`;
            
            // Upload the label to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('shipping-labels')
              .upload(fileName, labelBuffer, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: false
              });
              
            if (uploadError) {
              console.error('Error uploading existing label:', uploadError);
              // Fall back to original URL if upload fails
              return new Response(
                JSON.stringify({
                  labelUrl: pdfLabelURL,
                  trackingCode: shipmentData.tracking_code,
                  shipmentId: shipmentId
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            // Create a signed URL for the label
            const { data: signedURLData } = await supabase
              .storage
              .from('shipping-labels')
              .createSignedUrl(fileName, 60 * 60 * 24 * 14); // 2 weeks
              
            return new Response(
              JSON.stringify({
                labelUrl: signedURLData?.signedUrl || pdfLabelURL,
                trackingCode: shipmentData.tracking_code,
                shipmentId: shipmentId,
                message: 'Retrieved existing label'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } catch (downloadError) {
            console.error('Error downloading existing label:', downloadError);
            // Fall back to returning the original URL
            return new Response(
              JSON.stringify({
                labelUrl: labelURL,
                trackingCode: shipmentData.tracking_code,
                shipmentId: shipmentId,
                message: 'Using original EasyPost URL due to download error'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to create label', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Download the label PDF from EasyPost
    let labelURL = data.postage_label.label_url;
    console.log(`Label URL from EasyPost: ${labelURL}`);
    
    // Force PDF format for the download if not already PDF
    if (!labelURL.toLowerCase().endsWith('.pdf')) {
      labelURL = labelURL.replace(/\.(\w+)$/, '.pdf');
      console.log(`Converting label URL to PDF format: ${labelURL}`);
    }
    
    const labelResponse = await fetch(labelURL, {
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    if (!labelResponse.ok) {
      console.error(`Failed to download PDF label: ${labelResponse.status} ${labelResponse.statusText}`);
      
      // Try with original URL if PDF conversion fails
      const originalURL = data.postage_label.label_url;
      console.log(`Trying original URL: ${originalURL}`);
      
      const originalResponse = await fetch(originalURL);
      if (!originalResponse.ok) {
        console.error('Failed to download label from EasyPost with both PDF and original format');
        throw new Error('Failed to download label from EasyPost');
      }
      
      // Use original format if PDF fails
      labelURL = originalURL;
    }
    
    // Convert the label to a blob
    const labelBlob = await labelResponse.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    // Use PDF extension consistently for the filename
    const fileName = `label_${shipmentId}_${Date.now()}.pdf`;
    
    // Upload the label to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('shipping-labels')
      .upload(fileName, labelBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading label to storage:', uploadError);
      
      // If storage upload fails, still return the original EasyPost label URL
      return new Response(
        JSON.stringify({ 
          labelUrl: labelURL,
          trackingCode: data.tracking_code,
          shipmentId: data.id,
          message: 'Using original EasyPost URL due to storage error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a signed URL for the label with 2 weeks expiration
    const twoWeeksInSeconds = 60 * 60 * 24 * 14;
    const { data: signedURLData, error: signedURLError } = await supabase
      .storage
      .from('shipping-labels')
      .createSignedUrl(fileName, twoWeeksInSeconds);
      
    if (signedURLError) {
      console.error('Error creating signed URL:', signedURLError);
      
      // If we can't create a signed URL, try to get a public URL
      const { data: publicURLData } = await supabase
        .storage
        .from('shipping-labels')
        .getPublicUrl(fileName);
        
      if (publicURLData?.publicUrl) {
        // We have a public URL, use that
        return new Response(
          JSON.stringify({ 
            labelUrl: publicURLData.publicUrl,
            trackingCode: data.tracking_code,
            shipmentId: data.id,
            message: 'Using public URL'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // If that also fails, return the original EasyPost URL
      return new Response(
        JSON.stringify({ 
          labelUrl: labelURL,
          trackingCode: data.tracking_code,
          shipmentId: data.id,
          message: 'Using original EasyPost URL due to signed URL error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Save the shipping record in the database if you have shipment_records table
    try {
      const { error: dbError } = await supabase
        .from('shipment_records')
        .insert({
          shipment_id: shipmentId,
          rate_id: rateId,
          tracking_code: data.tracking_code,
          label_url: signedURLData.signedUrl,
          status: 'created',
          carrier: data.selected_rate?.carrier,
          service: data.selected_rate?.service,
          delivery_days: data.selected_rate?.delivery_days || null,
          charged_rate: data.selected_rate?.rate || null,
          easypost_rate: data.selected_rate?.rate || null,
          currency: data.selected_rate?.currency || 'USD'
        });
        
      if (dbError) {
        console.error('Error saving shipment record:', dbError);
        // Continue anyway as we already have the label URL
      }
    } catch (dbError) {
      console.error('Database error when saving shipment record:', dbError);
      // Continue as this is non-critical
    }

    // Return the label information with our internally stored URL
    return new Response(
      JSON.stringify({
        labelUrl: signedURLData.signedUrl || labelURL, // Fall back to EasyPost URL if needed
        trackingCode: data.tracking_code,
        shipmentId: data.id,
        format: 'pdf' // Explicitly specify format
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-label function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
