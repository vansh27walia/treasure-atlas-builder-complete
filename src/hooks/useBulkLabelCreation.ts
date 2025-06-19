
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useShipmentTracking } from './useShipmentTracking';

interface BulkLabelResult {
  success: boolean;
  labelUrl?: string;
  trackingCode?: string;
  shipmentId?: string;
  error?: string;
}

export const useBulkLabelCreation = () => {
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [progress, setProgress] = useState(0);
  const { trackNewShipment } = useShipmentTracking();

  const createBulkLabels = useCallback(async (shipments: any[]) => {
    setIsCreatingLabels(true);
    setProgress(0);
    
    const results: BulkLabelResult[] = [];
    let successCount = 0;
    
    try {
      for (let i = 0; i < shipments.length; i++) {
        const shipment = shipments[i];
        
        try {
          console.log(`Creating label ${i + 1}/${shipments.length}:`, shipment);
          
          // Create the label
          const { data, error } = await supabase.functions.invoke('create-label', {
            body: {
              shipmentId: shipment.shipmentId,
              rateId: shipment.selectedRateId,
              options: {}
            }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data && data.labelUrl && data.trackingCode) {
            console.log(`Label created for shipment ${i + 1}, saving tracking...`);
            
            // Save to tracking system
            const trackingSuccess = await trackNewShipment({
              trackingCode: data.trackingCode,
              carrier: shipment.carrier,
              shipmentId: shipment.shipmentId,
              rateId: shipment.selectedRateId,
              labelUrl: data.labelUrl,
              service: shipment.service,
              from_address: shipment.fromAddress,
              to_address: shipment.toAddress,
              parcel: shipment.parcel
            }, {
              fromAddress: shipment.fromAddress,
              toAddress: shipment.toAddress,
              parcel: shipment.parcel
            });

            if (trackingSuccess) {
              console.log(`Tracking saved for shipment ${i + 1}`);
            } else {
              console.warn(`Failed to save tracking for shipment ${i + 1}`);
            }

            results.push({
              success: true,
              labelUrl: data.labelUrl,
              trackingCode: data.trackingCode,
              shipmentId: shipment.shipmentId
            });
            
            successCount++;
          } else {
            throw new Error('Invalid response from label creation');
          }
        } catch (error) {
          console.error(`Error creating label ${i + 1}:`, error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        // Update progress
        setProgress(((i + 1) / shipments.length) * 100);
      }
      
      toast.success(`Successfully created ${successCount} out of ${shipments.length} labels with tracking data`);
      return results;
      
    } catch (error) {
      console.error('Bulk label creation error:', error);
      toast.error('Failed to create bulk labels');
      return results;
    } finally {
      setIsCreatingLabels(false);
      setProgress(0);
    }
  }, [trackNewShipment]);

  return {
    createBulkLabels,
    isCreatingLabels,
    progress
  };
};
