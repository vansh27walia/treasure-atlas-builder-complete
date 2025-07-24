
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

export interface BulkShippingResult {
  success: boolean;
  csvContent: string;
  rowCount: number;
  message: string;
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
      console.log('Starting Shopify bulk shipping process...');
      
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

      console.log('Shopify bulk shipping completed:', data);
      
      setResults(data);
      toast.success(data.message || 'Shopify orders processed successfully');
      
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
