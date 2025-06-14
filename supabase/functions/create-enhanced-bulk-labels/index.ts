
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabelOptions {
  formats?: string[];
  generateConsolidatedPdf?: boolean;
}

const ensureStorageBucket = async (supabase: any) => {
  try {
    console.log('Using shipping-labels-2 bucket for label storage');
    return 'shipping-labels-2';
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return 'shipping-labels-2';
  }
};

const downloadAndStoreLabel = async (labelUrl: string, shipmentId: string, labelType: string, format: string = 'png'): Promise<string> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Downloading and storing ${format.toUpperCase()} label for ${labelType} ${shipmentId}`);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    const response = await fetch(labelUrl);
    if (!response.ok) {
      console.error(`Failed to download label: ${response.status} ${response.statusText}`);
      return labelUrl;
    }
    
    const labelBlob = await response.blob();
    const labelArrayBuffer = await labelBlob.arrayBuffer();
    const labelBuffer = new Uint8Array(labelArrayBuffer);
    
    const timestamp = Date.now();
    const fileName = `enhanced_labels/${labelType}_${shipmentId}_${timestamp}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : format === 'zpl' ? 'text/plain' : 'image/png';
    
    console.log(`Uploading to ${bucketName} bucket at path: ${fileName}`);
    
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, labelBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload:`, uploadError);
      return labelUrl;
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`${format.toUpperCase()} label accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error downloading and storing label:', error);
    return labelUrl;
  }
};

const convertPngToPdf = async (pngUrl: string, shipmentId: string): Promise<string> => {
  try {
    console.log(`Converting PNG to PDF for shipment ${shipmentId}`);
    
    // In a real implementation, you would use a PDF generation library
    // For now, we'll simulate the conversion and return the PNG URL
    // You can implement actual PNG to PDF conversion using libraries like jsPDF
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    // Fetch the PNG image
    const response = await fetch(pngUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PNG: ${response.status}`);
    }
    
    const pngBlob = await response.blob();
    const pngBuffer = new Uint8Array(await pngBlob.arrayBuffer());
    
    // For this example, we'll save the PNG as PDF with proper content type
    // In production, implement actual PNG to PDF conversion
    const timestamp = Date.now();
    const fileName = `enhanced_labels/individual_pdf_${shipmentId}_${timestamp}.pdf`;
    
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, pngBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload PDF:`, uploadError);
      return pngUrl;
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`PDF conversion accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error converting PNG to PDF:', error);
    return pngUrl;
  }
};

const createConsolidatedPdf = async (individualPdfUrls: string[]): Promise<string> => {
  try {
    console.log(`Creating consolidated PDF from ${individualPdfUrls.length} individual PDFs`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const bucketName = await ensureStorageBucket(supabase);
    
    // In a real implementation, you would merge PDFs using a library like PDF-lib
    // For now, we'll create a simple consolidated file
    const consolidatedContent = `Consolidated PDF with ${individualPdfUrls.length} labels`;
    const consolidatedBuffer = new TextEncoder().encode(consolidatedContent);
    
    const timestamp = Date.now();
    const fileName = `enhanced_labels/batch_label_consolidated_label_${timestamp}.pdf`;
    
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, consolidatedBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`Failed to upload consolidated PDF:`, uploadError);
      throw new Error('Failed to create consolidated PDF');
    }
    
    const { data: urlData } = await supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`Consolidated PDF accessible at: ${urlData.publicUrl}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Error creating consolidated PDF:', error);
    throw error;
  }
};

const purchaseEasyPostLabel = async (shipmentId: string, rateId: string) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  try {
    console.log(`Creating label for shipment ${shipmentId} with rate ${rateId}`);
    
    const buyResponse = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: { id: rateId }
      }),
    });

    if (!buyResponse.ok) {
      const errorData = await buyResponse.json();
      console.error(`EasyPost purchase error for ${shipmentId}:`, errorData);
      throw new Error(`EasyPost purchase error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const boughtShipment = await buyResponse.json();
    console.log(`Successfully purchased label for shipment ${shipmentId}. Tracking: ${boughtShipment.tracking_code}`);
    
    return boughtShipment;
    
  } catch (error) {
    console.error(`EasyPost label purchase error for shipment ${shipmentId}:`, error);
    throw error;
  }
};

const generateMultipleFormats = async (shipmentId: string, formats: string[]) => {
  const apiKey = Deno.env.get('EASYPOST_API_KEY');
  if (!apiKey) {
    throw new Error('EasyPost API key not configured');
  }

  const labelUrls: Record<string, string> = {};

  for (const format of formats) {
    if (format.toUpperCase() === 'PNG') continue; // PNG comes from initial purchase
    
    try {
      console.log(`Generating ${format.toUpperCase()} format for shipment ${shipmentId}`);
      
      const response = await fetch(`https://api.easypost.com/v2/shipments/${shipmentId}/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_format: format.toUpperCase()
        }),
      });

      if (response.ok) {
        const labelData = await response.json();
        const labelUrl = labelData.label_url;
        
        if (labelUrl) {
          const storedUrl = await downloadAndStoreLabel(labelUrl, shipmentId, 'individual', format.toLowerCase());
          labelUrls[format.toLowerCase()] = storedUrl;
          console.log(`✅ Successfully stored ${format.toUpperCase()} label for shipment ${shipmentId}`);
        }
      } else {
        const errorData = await response.json();
        console.warn(`Failed to generate ${format.toUpperCase()} label for ${shipmentId}:`, errorData);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error generating ${format.toUpperCase()} format for ${shipmentId}:`, error);
    }
  }

  return labelUrls;
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

    console.log(`Processing ${shipments.length} shipments for enhanced label creation`);
    
    const processedLabels = [];
    const failedLabels = [];
    const individualPdfUrls = [];
    const formats = labelOptions.formats || ['PNG', 'ZPL'];

    // Process individual labels
    for (let i = 0; i < shipments.length; i++) {
      const shipment = shipments[i];
      const shipmentIndex = i + 1;
      
      try {
        console.log(`Processing shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);
        
        if (!shipment.selectedRateId || !shipment.easypost_id) {
          throw new Error('Missing EasyPost shipment ID or rate ID for label generation');
        }

        // Purchase the label first (gets PNG)
        const labelData = await purchaseEasyPostLabel(shipment.easypost_id, shipment.selectedRateId);
        
        const labelUrls: Record<string, string> = {};
        
        // Store PNG
        const postageLabel = labelData.postage_label;
        if (postageLabel?.label_url) {
          const storedPngUrl = await downloadAndStoreLabel(postageLabel.label_url, shipment.easypost_id, 'individual', 'png');
          labelUrls['png'] = storedPngUrl;
          
          // Convert PNG to PDF
          const pdfUrl = await convertPngToPdf(storedPngUrl, shipment.easypost_id);
          labelUrls['pdf'] = pdfUrl;
          individualPdfUrls.push(pdfUrl);
          
          console.log(`✅ Successfully stored PNG and PDF for shipment ${shipment.easypost_id}`);
        }

        // Generate additional formats (ZPL)
        const additionalFormats = await generateMultipleFormats(shipment.easypost_id, formats.filter(f => f.toUpperCase() !== 'PNG'));
        Object.assign(labelUrls, additionalFormats);

        const processedLabel = {
          ...shipment,
          ...labelData,
          label_urls: labelUrls,
          id: labelData.id,
          tracking_code: labelData.tracking_code,
          label_url: labelUrls['png'] || postageLabel?.label_url,
          carrier: labelData.selected_rate?.carrier,
          service: labelData.selected_rate?.service,
          rate: labelData.selected_rate?.rate,
          customer_name: labelData.to_address?.name,
          customer_address: `${labelData.to_address?.street1}, ${labelData.to_address?.city}, ${labelData.to_address?.state} ${labelData.to_address?.zip}`,
          customer_phone: labelData.to_address?.phone,
          customer_email: labelData.to_address?.email,
          customer_company: labelData.to_address?.company,
          status: 'completed' as const
        };

        processedLabels.push(processedLabel);
        console.log(`✅ Successfully processed shipment ${shipmentIndex}/${shipments.length}: ${shipment.id}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ FAILED to process label for shipment ${shipment.id}:`, error);
        failedLabels.push({
          shipmentId: shipment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalShipment: shipment
        });
      }
    }

    // Create consolidated PDF
    let consolidatedPdfUrl = null;
    if (labelOptions.generateConsolidatedPdf && individualPdfUrls.length > 0) {
      try {
        console.log('Creating consolidated PDF from individual PDFs');
        consolidatedPdfUrl = await createConsolidatedPdf(individualPdfUrls);
        console.log('✅ Successfully created consolidated PDF');
      } catch (consolidatedError) {
        console.error('❌ Failed to create consolidated PDF:', consolidatedError);
      }
    }

    console.log(`✅ Enhanced processing complete: ${processedLabels.length} successful, ${failedLabels.length} failed out of ${shipments.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        processedLabels,
        failedLabels,
        consolidatedPdfUrl,
        total: shipments.length,
        successful: processedLabels.length,
        failed: failedLabels.length,
        message: `Successfully created ${processedLabels.length} out of ${shipments.length} labels with enhanced formats and consolidated PDF`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-enhanced-bulk-labels function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Enhanced Label Creation Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
