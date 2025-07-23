
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BulkShippingOptions {
  insuranceOptions?: {
    declaredValue?: number;
    requireInsurance?: boolean;
  };
}

export interface ProcessedShipment {
  id: string;
  shipment_data: any;
  rates: any[];
  selected_rate_id?: string;
  insurance_amount?: number;
  insurance_cost?: number;
  total_cost: number;
  status: 'pending' | 'rates_fetched' | 'ready' | 'error';
  error_message?: string;
}

export interface BulkProcessingResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: ProcessedShipment[];
  message: string;
}

export const useBulkShippingProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkProcessingResult | null>(null);

  const processBulkShipping = async (
    csvContent: string,
    fromAddress: any,
    options: BulkShippingOptions = {}
  ) => {
    setIsProcessing(true);
    setResults(null);

    try {
      console.log('Starting bulk shipping processing...');
      
      const { data, error } = await supabase.functions.invoke('process-bulk-shipping', {
        body: {
          csvContent,
          fromAddress,
          insuranceOptions: options.insuranceOptions || {}
        }
      });

      if (error) {
        console.error('Error in bulk shipping processing:', error);
        throw new Error(error.message || 'Failed to process bulk shipping');
      }

      console.log('Bulk shipping processing completed:', data);
      
      setResults(data);
      toast.success(data.message || 'Bulk shipping processed successfully');
      
      return data;
      
    } catch (error) {
      console.error('Error processing bulk shipping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process bulk shipping');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSavedShipments = async () => {
    try {
      // Use supabase.from() directly with the table name as string
      const { data, error } = await supabase
        .from('bulk_shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved shipments:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching saved shipments:', error);
      toast.error('Failed to fetch saved shipments');
      throw error;
    }
  };

  const updateShipmentRate = async (shipmentId: string, rateId: string) => {
    try {
      // Use supabase.from() directly with the table name as string
      const { data, error } = await supabase
        .from('bulk_shipments')
        .update({ 
          selected_rate_id: rateId,
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating shipment rate:', error);
        throw error;
      }

      toast.success('Shipment rate updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating shipment rate:', error);
      toast.error('Failed to update shipment rate');
      throw error;
    }
  };

  return {
    isProcessing,
    results,
    processBulkShipping,
    fetchSavedShipments,
    updateShipmentRate
  };
};
