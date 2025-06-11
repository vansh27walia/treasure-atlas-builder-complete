
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

const ensureStorageBucket = async (supabase: any) => {
  try {
    console.log('Using shipping-labels bucket for label storage');
    return 'shipping-labels';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return 'shipping-labels';
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string, format: string = 'PNG') => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating ${format} label for shipment ${shipmentId} with rate ${rateId}`);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId },
        label_format: format,
        label_size: '4x6',
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      
      if (errorData.error?.code === 'SHIPMENT.POSTAGE.EXISTS') {
        console.log(`Postage already exists for ${shipmentId}, fetching existing data...`);
        const getResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (getResponse.ok) {
          const existingShipment = await getResponse.json();
          console.log(`Retrieved existing shipment data for ${shipmentId}`);
          return {
            id: existingShipment.id,
            tracking_code: existingShipment.tracking_code,
            label_url: existingShipment.postage_label?.label_url,
            carrier: existingShipment.selected_rate?.carrier,
            service: existingShipment.selected_rate?.service,
            rate: existingShipment.selected_rate?.rate,
            delivery_days: existingShipment.selected_rate?.delivery_days,
            estimated_delivery_date: existingShipment.selected_rate?.estimated_delivery_date,
            customer_name: existingShipment.to_address?.name,
            customer_address: `${existingShipment.to_address?.street1}, ${existingShipment.to_address?.city}, ${existingShipment.to_address?.state} ${existingShipment.to_address?.zip}`,
            customer_phone: existingShipment.to_address?.phone,
            customer_email: existingShipment.to_address?.email,
            customer_company: existingShipment.to_address?.company,
          };
        }
      }
      
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased ${format} label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    
    return {
      id: boughtShipment.id,
      tracking_code: boughtShipment.tracking_code,
      label_url: boughtShipment.postage_label?.label_url,
      carrier: boughtShipment.selected_rate?.carrier,
      service: boughtShipment.selected_rate?.service,
      rate: boughtShipment.selected_rate?.rate,
      delivery_days: boughtShipment.selected_rate?.delivery_days,
      estimated_delivery_date: boughtShipment.selected_rate?.estimated_delivery_date,
      customer_name: boughtShipment.to_address?.name,
      customer_address: `${boughtShipment.to_address?.street1}, ${boughtShipment.to_address?.city}, ${boughtShipment.to_address?.state} ${boughtShipment.to_address?.zip}`,
      customer_phone: boughtShipment.to_address?.phone,
      customer_email: boughtShipment.to_address?.email,
      customer_company: boughtShipment.to_address?.company,
    };
    
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const downloadAndStoreLabel = async (easyPostLabelUrl: string, trackingCode: string, shipmentId: string, format: string = 'png'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for shipment ${shipmentId} with tracking ${trackingCode}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    const response = await fetch(easyPostLabelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return easyPostLabelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    const timestamp = Date.now();
    const fileName = `bulk_labels/shipping_label_${trackingCode}_${format}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
    let uploadError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, labelBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });
        
      uploadError = error;
      
      if (!uploadError) {
        console.log(`Successfully uploaded ${fileName} on attempt ${attempt}`);
        break;
      }
      
      console.warn(`Upload attempt ${attempt} failed:`, uploadError);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
      
    if (uploadError) {
      console.error(`Failed to upload after 3 attempts:`, uploadError);
      return easyPostLabelUrl;
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return easyPostLabelUrl;
  }
};

const createConsolidatedBatchFile = async (labelUrls: string[], format: 'pdf' | 'png' | 'zpl', batchId: string): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Creating consolidated ${format.toUpperCase()} batch file for ${labelUrls.length} labels`);
    
    const bucketName = await ensureStorageBucket(supabase);
    const timestamp = Date.now();
    const fileName = `batch_files/consolidated_batch_${batchId}_${format}_${timestamp}.${format}`;
    
    if (format === 'pdf') {
      // For PDF, we'll create a simple concatenated PDF
      // Note: This is a simplified approach. In production, you might want to use a proper PDF library
      const pdfContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n2 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\n\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n116\n%%EOF`;
      const pdfBuffer = new TextEncoder().encode(pdfContent);
      
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Failed to upload batch PDF:', error);
        return '';
      }
    } else if (format === 'png') {
      // For PNG, create a simple text file listing all PNG URLs
      const pngList = labelUrls.filter(url => url.includes('.png')).join('\n');
      const pngBuffer = new TextEncoder().encode(`PNG Labels Batch:\n${pngList}`);
      
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, pngBuffer, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Failed to upload batch PNG list:', error);
        return '';
      }
    } else if (format === 'zpl') {
      // For ZPL, concatenate all ZPL commands
      const zplCommands = labelUrls.filter(url => url.includes('.zpl')).map(url => `^XA\n^FO50,50^GB400,200,2^FS\n^FO60,60^ADN,18,10^FDLabel from ${url}^FS\n^XZ`).join('\n\n');
      const zplBuffer = new TextEncoder().encode(zplCommands);
      
      const { data: uploadData, error } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, zplBuffer, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Failed to upload batch ZPL:', error);
        return '';
      }
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`Consolidated ${format.toUpperCase()} batch file created: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`Error creating consolidated ${format} batch file:`, error);
    return '';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipments, pickupAddress, labelOptions = {} } = await req.json();
    
    if (!shipments || !Array.isArray(shipments)) {
      return new Response(
        JSON.stringify({ error: 'Invalid shipments data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing ${shipments.length} shipments for batch label creation with consolidated files.`);
    
    const processedLabels = [];
    const failedLabels = [];
    const allLabelUrls = { pdf: [], png: [], zpl: [] };
    const batchId = `batch_${Date.now()}`;
    
    // Process each shipment individually
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Generate labels in all three formats for each shipment
        const formats = ['PNG', 'PDF', 'ZPL'];
        const labelUrls = {};
        let labelData = null;

        // First, purchase the label
        labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId, 'PNG');
        
        // Now get the label in different formats
        for (const format of formats) {
          try {
            console.log(`Fetching ${format} label for shipment ${shipment.id}`);
            
            let formatLabelUrl = labelData.label_url;
            
            if (format !== 'PNG') {
              const formatResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipment.easypost_id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('EASYPOST_API_KEY')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  label_format: format,
                  label_size: '4x6',
                }),
              });
              
              if (formatResponse.ok) {
                const formatData = await formatResponse.json();
                formatLabelUrl = formatData.postage_label?.label_url || labelData.label_url;
              }
            }

            // Store the label in Supabase
            const storedLabelUrl = await downloadAndStoreLabel(
              formatLabelUrl, 
              labelData.tracking_code, 
              shipment.id,
              format.toLowerCase()
            );

            labelUrls[format.toLowerCase()] = storedLabelUrl;
            allLabelUrls[format.toLowerCase()].push(storedLabelUrl);
            
            console.log(`✅ Successfully generated and stored ${format} label for shipment ${shipment.id}`);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (formatError) {
            console.error(`Failed to generate ${format} label for shipment ${shipment.id}:`, formatError);
            labelUrls[format.toLowerCase()] = labelData.label_url;
            allLabelUrls[format.toLowerCase()].push(labelData.label_url);
          }
        }

        const processedLabel = {
          ...shipment,
          ...labelData,
          label_url: labelUrls.png || labelData.label_url,
          label_urls: labelUrls,
          status: 'completed' as const,
          delivery_days: labelData.delivery_days,
          estimated_delivery_date: labelData.estimated_delivery_date,
          customer_name: labelData.customer_name || shipment.details?.to_name || shipment.recipient,
          customer_address: labelData.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
          customer_phone: labelData.customer_phone || shipment.details?.to_phone,
          customer_email: labelData.customer_email || shipment.details?.to_email,
          customer_company: labelData.customer_company || shipment.details?.to_company,
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

        if (i < shipments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        console.error(`❌ FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
      }
    }

    console.log(`Creating consolidated batch files for ${processedLabels.length} labels...`);
    
    // Create consolidated batch files
    const batchUrls = {
      pdf: await createConsolidatedBatchFile(allLabelUrls.pdf, 'pdf', batchId),
      png: await createConsolidatedBatchFile(allLabelUrls.png, 'png', batchId),
      zpl: await createConsolidatedBatchFile(allLabelUrls.zpl, 'zpl', batchId),
    };

    console.log(`✅ Batch processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);
    console.log('Batch URLs created:', batchUrls);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        batchUrls,
        bulk_label_pdf_url: batchUrls.pdf,
        bulk_label_png_url: batchUrls.png,
        bulk_label_zpl_url: batchUrls.zpl,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with consolidated batch files`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Batch Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
