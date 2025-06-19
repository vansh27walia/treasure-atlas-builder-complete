
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
  recipient_name?: string;
  recipient_address?: string;
}

export const useShipmentTracking = () => {
  const saveShipmentToDatabase = useCallback(async (shipmentData: ShipmentData) => {
    try {
      console.log('Saving shipment to new shipments table:', shipmentData);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Format recipient address
      const recipientAddress = shipmentData.to_address ? 
        `${shipmentData.to_address.street1 || ''} ${shipmentData.to_address.street2 || ''}, ${shipmentData.to_address.city || ''}, ${shipmentData.to_address.state || ''} ${shipmentData.to_address.zip || ''}`.trim() : 
        shipmentData.recipient_address || 'Unknown';

      // Check if shipment already exists
      const { data: existingShipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_code', shipmentData.tracking_code)
        .eq('user_id', user.id)
        .single();

      if (existingShipment) {
        console.log('Shipment already exists, updating...');
        
        // Update existing shipment
        const { error: updateError } = await supabase
          .from('shipments')
          .update({
            label_url: shipmentData.label_url,
            status: shipmentData.status || 'created',
            recipient_name: shipmentData.recipient_name || shipmentData.to_address?.name,
            recipient_address: recipientAddress,
            service: shipmentData.service,
            updated_at: new Date().toISOString()
          })
          .eq('tracking_code', shipmentData.tracking_code)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating shipment:', updateError);
          throw updateError;
        }
      } else {
        // Insert new shipment record
        const { error: insertError } = await supabase
          .from('shipments')
          .insert([{
            user_id: user.id,
            tracking_code: shipmentData.tracking_code,
            carrier: shipmentData.carrier,
            shipment_id: shipmentData.shipment_id,
            label_url: shipmentData.label_url,
            service: shipmentData.service,
            status: shipmentData.status || 'created',
            recipient_name: shipmentData.recipient_name || shipmentData.to_address?.name || 'Unknown',
            recipient_address: recipientAddress,
            package_details: {
              weight: shipmentData.parcel?.weight ? `${shipmentData.parcel.weight} oz` : 'Unknown',
              dimensions: shipmentData.parcel ? 
                `${shipmentData.parcel.length || 0}x${shipmentData.parcel.width || 0}x${shipmentData.parcel.height || 0} in` : 
                'Unknown',
              service: shipmentData.service || 'Standard'
            },
            tracking_history: {
              events: [],
              created_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error inserting shipment:', insertError);
          throw insertError;
        }
      }

      console.log('Shipment saved successfully to shipments table');
      return true;
    } catch (error) {
      console.error('Error saving shipment to shipments table:', error);
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
      status: 'created',
      recipient_name: shipmentDetails?.toAddress?.name,
      recipient_address: shipmentDetails?.toAddress ? 
        `${shipmentDetails.toAddress.street1 || ''} ${shipmentDetails.toAddress.street2 || ''}, ${shipmentDetails.toAddress.city || ''}, ${shipmentDetails.toAddress.state || ''} ${shipmentDetails.toAddress.zip || ''}`.trim() : 
        undefined
    };

    return await saveShipmentToDatabase(shipmentData);
  }, [saveShipmentToDatabase]);

  return {
    trackNewShipment,
    saveShipmentToDatabase
  };
};
