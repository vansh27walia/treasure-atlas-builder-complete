
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  format?: string;
  size?: string;
}

interface ShipmentData {
  id: string;
  easypost_id: string;
  selectedRateId: string;
  recipient: string;
  details: any;
}

const createEasyPostBulkLabels = async (shipments: ShipmentData[], userId: string, labelOptions: LabelOptions = {}) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating bulk labels for ${shipments.length} shipments via EasyPost.`);
    
    const labels = [];
    const batchId = `batch_${Date.now()}`;

    for (const shipmentData of shipments) {
      try {
        console.log(`Processing shipment ${shipmentData.id} with EasyPost ID: ${shipmentData.easypost_id}`);
        
        // Buy the shipment with the selected rate
        const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentData.easypost_id}/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rate: { id: shipmentData.selectedRateId }
          }),
        });

        if (!buyResponse.ok) {
          const errorData = await buyResponse.json();
          console.error(`Failed to buy shipment ${shipmentData.easypost_id}:`, errorData);
          continue;
        }

        const shipment = await buyResponse.json();
        console.log(`Successfully purchased shipment ${shipment.id}, tracking: ${shipment.tracking_code}`);

        if (shipment.postage_label && shipment.tracking_code) {
          // Store label in our storage
          const labelUrls = await downloadAndStoreLabel(shipment.postage_label, shipment.tracking_code, userId, batchId);
          
          // Get drop-off address (use from_address as drop-off location)
          const dropOffAddress = `${shipment.from_address?.street1 || ''}, ${shipment.from_address?.city || ''}, ${shipment.from_address?.state || ''} ${shipment.from_address?.zip || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
          
          // Create tracking URL
          const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.tracking_code}`;
          
          labels.push({
            shipment_id: shipmentData.id,
            recipient_name: shipmentData.details?.to_name || shipmentData.recipient,
            drop_off_address: dropOffAddress,
            tracking_number: shipment.tracking_code,
            tracking_url: trackingUrl,
            label_url: labelUrls.pdf || labelUrls.png || '',
            carrier: shipment.selected_rate?.carrier || 'Unknown',
            service: shipment.selected_rate?.service || 'Unknown',
            rate: shipment.selected_rate?.rate || 0,
            easypost_id: shipment.id,
            batch_id: batchId
          });
        }
      } catch (error) {
        console.error(`Error processing shipment ${shipmentData.id}:`, error);
      }
    }

    // Generate bulk label URL (for now, we'll use the first label as bulk - in production you'd merge PDFs)
    let bulkLabelUrl = null;
    if (labels.length > 0) {
      bulkLabelUrl = labels[0].label_url; // In production, you'd create a merged PDF here
    }

    return {
      status: 'success',
      labels,
      bulk_label_url: bulkLabelUrl,
      total_labels: labels.length
    };

  } catch (error) {
    console.error('Error during bulk label creation process:', error);
    throw error;
  }
};

const downloadAndStoreLabel = async (postageLabel: any, trackingCode: string, userId: string, batchId: string): Promise<Record<string, string>> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const labelUrls: Record<string, string> = {};
  
  if (!postageLabel) {
    console.error('No postage label data available');
    return labelUrls;
  }
  
  // EasyPost provides different format URLs
  const formats = [
    { key: 'pdf', url: postageLabel.label_url, contentType: 'application/pdf', extension: 'pdf' },
    { key: 'png', url: postageLabel.label_png_url, contentType: 'image/png', extension: 'png' },
    { key: 'zpl', url: postageLabel.label_zpl_url, contentType: 'text/plain', extension: 'zpl' }
  ];

  for (const format of formats) {
    if (!format.url) {
      console.log(`No ${format.key.toUpperCase()} URL available for tracking ${trackingCode}`);
      continue;
    }
    
    try {
      console.log(`Downloading ${format.key.toUpperCase()} label from EasyPost: ${format.url}`);
      
      // Download the label from EasyPost
      const response = await fetch(format.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Lovable-Shipping-App/1.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`Failed to download ${format.key} format: ${response.status} ${response.statusText}`);
        continue;
      }
      
      // Get the file content as array buffer
      const labelArrayBuffer = await response.arrayBuffer();
      const labelBuffer = new Uint8Array(labelArrayBuffer);
      
      // Verify we got actual content
      if (labelBuffer.length === 0) {
        console.warn(`Downloaded ${format.key} label is empty for tracking ${trackingCode}`);
        continue;
      }
      
      console.log(`Downloaded ${format.key} label: ${labelBuffer.length} bytes`);
      
      const fileName = `shipping_label_${trackingCode}_${Date.now()}.${format.extension}`;
      const filePath = `${batchId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('shipping-labels-2')
        .upload(filePath, labelBuffer, {
          contentType: format.contentType,
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error(`Error uploading ${format.key} label:`, uploadError);
        continue;
      }
      
      // Get the public URL
      const { data: urlData } = await supabase
        .storage
        .from('shipping-labels-2')
        .getPublicUrl(filePath);
        
      labelUrls[format.key] = urlData.publicUrl;
      
      // Insert record into bulk_label_uploads table
      const { error: insertError } = await supabase
        .from('bulk_label_uploads')
        .insert({
          user_id: userId,
          batch_id: batchId,
          file_name: fileName,
          file_path: filePath,
          file_size: labelBuffer.length,
          file_type: format.key.toUpperCase(),
          tracking_code: trackingCode,
          upload_status: 'completed'
        });
        
      if (insertError) {
        console.error(`Error inserting ${format.key} label record:`, insertError);
      } else {
        console.log(`Successfully stored ${format.key.toUpperCase()} label: ${urlData.publicUrl}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${format.key} label for tracking ${trackingCode}:`, error);
    }
  }
  
  return labelUrls;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { shipments, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for bulk label creation`);

    // Ensure storage bucket exists
    const { error: bucketError } = await supabase.functions.invoke('create-storage-bucket');
    if (bucketError) {
      console.error('Error initializing storage bucket:', bucketError);
    }

    // Create labels using EasyPost
    const result = await createEasyPostBulkLabels(shipments, user.id, labelOptions);

    console.log(`Bulk label creation complete: ${result.labels.length} successful labels created`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Bulk Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
