
import { useState, useCallback } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'editing' | 'creating-labels' | 'mapping';

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
      setProgress(0);
    }
  }, []);

  const handleUpload = useCallback(async (uploadFile: File, pickupAddress: SavedAddress) => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setProgress(0);

    try {
      console.log('Starting file upload process...');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('pickupAddress', JSON.stringify(pickupAddress));

      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Upload failed');
      }

      console.log('Upload successful:', data);
      
      if (data.requiresMapping) {
        setUploadStatus('mapping');
        setResults({
          ...data,
          uploadStatus: 'mapping',
          pickupAddress
        });
      } else {
        setUploadStatus('editing');
        setResults({
          ...data,
          uploadStatus: 'editing',
          pickupAddress
        });
      }

      toast.success(`Successfully processed ${data.successful || 0} shipments`);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = [
      'to_name,to_street1,to_street2,to_city,to_state,to_zip,to_country,weight,length,width,height,reference',
      'John Doe,123 Main St,,San Francisco,CA,94105,US,1.5,12,8,4,Order #1234',
      'Jane Smith,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,2.0,10,6,3,Order #1235'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'bulk_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
