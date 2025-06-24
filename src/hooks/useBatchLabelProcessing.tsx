
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BatchResult {
  batchId: string;
  consolidatedLabelUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  scanFormUrl?: string;
}

export const useBatchLabelProcessing = () => {
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  const processBatchLabels = async (shipments: any[], pickupAddress?: any) => {
    setIsProcessingBatch(true);
    
    try {
      console.log('Processing batch labels for shipments:', shipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments,
          pickupAddress,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Batch processing response:', data);

      if (data.batchResult) {
        setBatchResult(data.batchResult);
        toast.success(`Successfully processed ${data.successful} labels with batch consolidation`);
        return data;
      } else {
        throw new Error('No batch result returned from backend');
      }

    } catch (error) {
      console.error('Error processing batch labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process batch labels');
      throw error;
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const downloadConsolidatedLabel = (format: 'pdf' | 'png' | 'zpl' | 'epl') => {
    if (!batchResult?.consolidatedLabelUrls[format]) {
      toast.error(`${format.toUpperCase()} label not available`);
      return;
    }

    const link = document.createElement('a');
    link.href = batchResult.consolidatedLabelUrls[format]!;
    link.download = `consolidated_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded consolidated ${format.toUpperCase()} labels`);
  };

  const downloadScanForm = () => {
    if (!batchResult?.scanFormUrl) {
      toast.error('Scan form not available');
      return;
    }

    const link = document.createElement('a');
    link.href = batchResult.scanFormUrl;
    link.download = `scan_form_${Date.now()}.pdf`;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Downloaded scan form');
  };

  return {
    isProcessingBatch,
    batchResult,
    processBatchLabels,
    downloadConsolidatedLabel,
    downloadScanForm,
    setBatchResult
  };
};
