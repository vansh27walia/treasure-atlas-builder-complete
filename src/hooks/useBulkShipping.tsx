
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RRow {
  recipient_name: string;
  recipient_address1: string;
  recipient_city: string;
  recipient_state: string;
  recipient_zip: string;
  recipient_country: string;
  recipient_phone?: string;
  recipient_email?: string;
  parcel_weight: number;
  parcel_length: number;
  parcel_width: number;
  parcel_height: number;
  order_reference?: string;
}

export interface ProcessedShipment {
  shipmentId: string;
  toAddress: any;
  selectedRate: {
    id: string;
    carrier: string;
    service: string;
    rate: number;
  };
  originalRow: RRow;
}

export interface BulkShippingResult {
  processed: ProcessedShipment[];
  failed: Array<{ row: RRow; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export const useBulkShipping = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkShippingResult | null>(null);

  const processBulkShipping = async (
    rows: RRow[],
    carrier: string = 'all'
  ): Promise<BulkShippingResult> => {
    setIsProcessing(true);
    setResults(null);

    try {
      console.log('Starting bulk shipping process...');
      
      const { data, error } = await supabase.functions.invoke('bulk-ship', {
        body: {
          rows,
          carrier
        }
      });

      if (error) {
        console.error('Error in bulk shipping:', error);
        throw new Error(error.message || 'Failed to process bulk shipping');
      }

      console.log('Bulk shipping completed:', data);
      
      setResults(data);
      
      if (data.summary.successful > 0) {
        toast.success(`Successfully processed ${data.summary.successful} out of ${data.summary.total} shipments`);
      }
      
      if (data.summary.failed > 0) {
        toast.error(`${data.summary.failed} shipments failed to process`);
      }
      
      return data;
      
    } catch (error) {
      console.error('Error processing bulk shipping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process bulk shipping');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    results,
    processBulkShipping
  };
};
