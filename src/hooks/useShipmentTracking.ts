
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ShipmentData {
  tracking_code: string;
  carrier: string;
  shipment_id: string;
  rate_id?: string;
  label_url?: string;
  service?: string;
  from_address?: any;
  to_address?: any;
  parcel?: any;
  status?: string;
}

export const useShipmentTracking = () => {
  const saveShipmentToDatabase = useCallback(async (shipmentData: ShipmentData) => {
    try {
      console.log('Saving shipment to database:', shipmentData);
      
      // Check if shipment already exists
      const { data: existingShipment } = await supabase
        .from('shipment_records')
        .select('id')
        .eq('tracking_code', shipmentData.tracking_code)
        .single();

      if (existingShipment) {
        console.log('Shipment already exists, updating...');
        
        // Update existing shipment
        const { error: updateError } = await supabase
          .from('shipment_records')
          .update({
            label_url: shipmentData.label_url,
            status: shipmentData.status || 'created',
            updated_at: new Date().toISOString()
          })
          .eq('tracking_code', shipmentData.tracking_code);

        if (updateError) {
          console.error('Error updating shipment:', updateError);
          throw updateError;
        }
      } else {
        // Insert new shipment record
        const { error: insertError } = await supabase
          .from('shipment_records')
          .insert([{
            tracking_code: shipmentData.tracking_code,
            carrier: shipmentData.carrier,
            shipment_id: shipmentData.shipment_id,
            rate_id: shipmentData.rate_id,
            label_url: shipmentData.label_url,
            service: shipmentData.service,
            status: shipmentData.status || 'created',
            from_address_json: shipmentData.from_address,
            to_address_json: shipmentData.to_address,
            parcel_json: shipmentData.parcel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error inserting shipment:', insertError);
          throw insertError;
        }
      }

      console.log('Shipment saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving shipment to database:', error);
      toast.error('Failed to save shipment tracking information');
      return false;
    }
  }, []);

  const trackNewShipment = useCallback(async (labelData: any, shipmentDetails?: any) => {
    if (!labelData.trackingCode || !labelData.carrier) {
      console.warn('Missing tracking code or carrier for shipment tracking');
      return false;
    }

    const shipmentData: ShipmentData = {
      tracking_code: labelData.trackingCode,
      carrier: labelData.carrier,
      shipment_id: labelData.shipmentId || '',
      rate_id: labelData.rateId,
      label_url: labelData.labelUrl,
      service: labelData.service,
      from_address: shipmentDetails?.fromAddress,
      to_address: shipmentDetails?.toAddress,
      parcel: shipmentDetails?.parcel,
      status: 'created'
    };

    return await saveShipmentToDatabase(shipmentData);
  }, [saveShipmentToDatabase]);

  return {
    trackNewShipment,
    saveShipmentToDatabase
  };
};
