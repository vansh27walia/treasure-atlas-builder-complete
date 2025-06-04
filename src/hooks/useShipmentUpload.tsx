
import { useState, useCallback } from 'react';
import { BulkUploadResult, BulkShipment, ShippingAddress } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Update the upload status type to include 'creating-labels'
export type UploadStatus = 'idle' | 'success' | 'error' | 'editing' | 'creating-labels';

export const useShipmentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      setUploadStatus('idle');
      setResults(null);
    }
  }, []);

  const handleUpload = useCallback(async (file: File, pickupAddress: SavedAddress) => {
    if (!file || !pickupAddress) {
      throw new Error('File and pickup address are required');
    }

    setIsUploading(true);
    setProgress(0);
    setUploadStatus('editing');

    try {
      console.log('Starting upload with pickup address:', pickupAddress);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pickupAddress', JSON.stringify({
        name: pickupAddress.name,
        company: pickupAddress.company,
        street1: pickupAddress.street1,
        street2: pickupAddress.street2,
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip: pickupAddress.zip,
        country: pickupAddress.country,
        phone: pickupAddress.phone,
        residential: false
      }));

      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: formData
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Upload response:', data);

      if (data && data.processedShipments) {
        const uploadResult: BulkUploadResult = {
          total: data.total || data.processedShipments.length,
          successful: data.successful || data.processedShipments.length,
          failed: data.failed || 0,
          totalCost: data.totalCost || 0,
          processedShipments: data.processedShipments || [],
          failedShipments: data.failedShipments || [],
          uploadStatus: 'editing',
          pickupAddress: {
            name: pickupAddress.name || '',
            company: pickupAddress.company,
            street1: pickupAddress.street1,
            street2: pickupAddress.street2,
            city: pickupAddress.city,
            state: pickupAddress.state,
            zip: pickupAddress.zip,
            country: pickupAddress.country,
            phone: pickupAddress.phone,
            residential: false
          }
        };

        setResults(uploadResult);
        setProgress(100);
        setUploadStatus('editing');
        
        toast.success(`Successfully processed ${data.processedShipments.length} shipments`);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = [
      'to_name,to_street1,to_street2,to_city,to_state,to_zip,to_country,weight,length,width,height,reference',
      'John Doe,123 Main St,,San Francisco,CA,94105,US,1.5,12,8,4,Order #1234',
      'Jane Smith,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,2.0,10,6,3,Order #1235',
      'Bob Johnson,789 Pine St,,New York,NY,10001,US,3.0,15,10,6,Order #1236'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'easypost_bulk_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Template downloaded successfully');
  }, []);

  return {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange,
    handleUpload,
    handleDownloadTemplate
  };
};
