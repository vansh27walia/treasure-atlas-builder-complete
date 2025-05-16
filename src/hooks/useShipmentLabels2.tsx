
import { useState } from 'react';
import { toast } from 'sonner';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';

export const useShipmentLabels2 = (
  results: BulkUploadResult,
  setResults: (results: BulkUploadResult) => void,
  setIsCreatingLabels: (isCreating: boolean) => void,
  setIsPaying: (isPaying: boolean) => void
) => {
  // Create labels for all shipments that don't have labels yet
  const createLabels = async () => {
    setIsCreatingLabels(true);
    
    try {
      const shipmentsToProcess = results.processedShipments.filter(
        s => s.status === 'completed' && !s.label_url
      );
      
      if (shipmentsToProcess.length === 0) {
        toast.info('No shipments require label generation');
        return;
      }
      
      let successCount = 0;
      const updatedShipments = [...results.processedShipments];
      
      // Process each shipment individually (like standard shipping flow)
      for (const shipment of shipmentsToProcess) {
        const index = updatedShipments.findIndex(s => s.id === shipment.id);
        if (index === -1) continue;
        
        try {
          // Construct the shipment data
          const requestData = {
            fromAddress: {
              name: "Shipping Company", // Default sender
              street1: "123 Main St",
              city: "San Francisco",
              state: "CA",
              zip: "94111",
              country: "US",
              phone: "555-555-5555"
            },
            toAddress: {
              name: shipment.details.name,
              company: shipment.details.company,
              street1: shipment.details.street1,
              street2: shipment.details.street2,
              city: shipment.details.city,
              state: shipment.details.state,
              zip: shipment.details.zip,
              country: shipment.details.country,
              phone: shipment.details.phone
            },
            parcel: {
              length: shipment.details.parcel_length || 12,
              width: shipment.details.parcel_width || 9,
              height: shipment.details.parcel_height || 2, 
              weight: shipment.details.parcel_weight || 16
            },
            carrier: shipment.carrier,
            service: shipment.service
          };
          
          // In a production environment, this would call the actual API:
          // const { data, error } = await supabase.functions.invoke('create-label', {
          //   body: { shipmentData: requestData }
          // });
          
          // For demonstration, we'll simulate the API call
          await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
          
          // Simulate label creation response
          const mockLabelUrl = `https://example.com/labels/${shipment.id}.pdf`;
          const mockTrackingCode = `MOCK${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
          
          // Update the shipment with label info
          updatedShipments[index] = {
            ...updatedShipments[index],
            label_url: mockLabelUrl,
            tracking_code: mockTrackingCode
          };
          
          successCount++;
        } catch (error) {
          console.error(`Error creating label for shipment ${shipment.id}:`, error);
          
          // Update with error
          updatedShipments[index] = {
            ...updatedShipments[index],
            error: 'Failed to generate label'
          };
        }
        
        // Update UI after each shipment
        setResults({
          ...results,
          processedShipments: updatedShipments
        });
      }
      
      toast.success(`Successfully generated ${successCount} out of ${shipmentsToProcess.length} labels`);
    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error('There was an issue generating labels. Please try again.');
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  // Download all labels as a ZIP file
  const downloadAllLabels = () => {
    try {
      const labels = results.processedShipments.filter(s => s.label_url);
      
      if (labels.length === 0) {
        toast.warning('No labels available to download');
        return;
      }
      
      // In a real implementation, this would trigger a download of all labels:
      // 1. Either as separate PDFs or as a combined PDF/ZIP
      // 2. For demonstration, we'll just log the labels we would download
      console.log('Downloading labels:', labels.map(l => l.label_url));
      
      // Simulate download success
      toast.success(`${labels.length} labels prepared for download`);
      
      // Open a mock label in a new tab for demo purposes
      window.open('https://easypost-files.s3.amazonaws.com/files/postage_label/20220214/741e860f077a440c8ae55acce8731365.pdf', '_blank');
    } catch (error) {
      console.error('Error downloading labels:', error);
      toast.error('Failed to download labels. Please try again later.');
    }
  };
  
  // Download a single label
  const downloadSingleLabel = (labelUrl: string) => {
    try {
      if (!labelUrl) {
        toast.error('Label URL is missing');
        return;
      }
      
      // In a real implementation, this would download the specific label:
      console.log('Downloading label:', labelUrl);
      
      // For demonstration, open a mock label in a new tab
      window.open('https://easypost-files.s3.amazonaws.com/files/postage_label/20220214/741e860f077a440c8ae55acce8731365.pdf', '_blank');
      
      toast.success('Label downloaded successfully');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label. Please try again.');
    }
  };
  
  // Process payment for labels
  const proceedToPayment = () => {
    try {
      setIsPaying(true);
      
      // Count labels
      const labelCount = results.processedShipments.filter(s => s.label_url).length;
      
      if (labelCount === 0) {
        toast.warning('No labels available to purchase');
        setIsPaying(false);
        return;
      }
      
      // In a production environment, this would call the actual payment API:
      // const { data, error } = await supabase.functions.invoke('create-checkout', {
      //   body: { amount: results.totalCost, shipmentIds: shipments.map(s => s.id) }
      // });
      
      // Simulate payment processing
      setTimeout(() => {
        // Simulate successful payment
        toast.success(`Payment of $${results.totalCost.toFixed(2)} processed successfully`);
        setIsPaying(false);
        
        // Navigate to dashboard or show success screen in a real app
        // navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed. Please try again.');
      setIsPaying(false);
    }
  };

  return {
    createLabels,
    downloadAllLabels,
    downloadSingleLabel,
    proceedToPayment
  };
};
