
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface BatchLabelActionsManagerProps {
  children: React.ReactNode;
}

const BatchLabelActionsManager: React.FC<BatchLabelActionsManagerProps> = ({ children }) => {
  const handleDownloadSingleLabel = (labelUrl: string, format: string = 'pdf') => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Open in new tab for preview
      window.open(labelUrl, '_blank');
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  };

  const handleConsolidatedDownload = (format: string, batchId?: string) => {
    if (!batchId) {
      toast.error('Batch ID not available');
      return;
    }
    
    // Generate consolidated label URL from Supabase storage
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    const consolidatedUrl = `${baseUrl}/batch_label_${batchId}.${format}`;
    
    handleDownloadSingleLabel(consolidatedUrl, format);
  };

  const handleEmailLabel = async (email: string, shipmentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-label-email', {
        body: {
          email,
          shipmentId,
          type: 'individual'
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    }
  };

  const handleEmailAll = async (emails: string[], batchId?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-label-email', {
        body: {
          emails,
          batchId,
          type: 'batch'
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Batch email error:', error);
      toast.error('Failed to send batch emails');
    }
  };

  const handleStoreLabel = async (labelUrl: string, shipmentId: string, format: string) => {
    try {
      const { error } = await supabase.functions.invoke('store-label-files', {
        body: {
          labelUrl,
          shipmentId,
          format,
          type: 'individual'
        }
      });

      if (error) {
        console.error('Store label error:', error);
      }
    } catch (error) {
      console.error('Store label error:', error);
    }
  };

  // Provide functions to children through context or props
  return React.cloneElement(children as React.ReactElement, {
    onDownloadSingleLabel: handleDownloadSingleLabel,
    onConsolidatedDownload: handleConsolidatedDownload,
    onEmailLabel: handleEmailLabel,
    onEmailAll: handleEmailAll,
    onStoreLabel: handleStoreLabel
  });
};

export default BatchLabelActionsManager;
