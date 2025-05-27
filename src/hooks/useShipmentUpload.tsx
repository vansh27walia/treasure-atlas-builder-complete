
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

// Helper function to validate and normalize status values
const normalizeStatus = (status: string): 'pending' | 'processing' | 'error' | 'completed' => {
  if (status === 'pending' || status === 'processing' || status === 'error' || status === 'completed') {
    return status;
  }
  // Map other potential statuses to one of our allowed values
  if (status === 'created') return 'pending';
  if (status === 'success') return 'completed';
  if (status === 'failed') return 'error';
  // Default fallback
  return 'pending';
};

export const useShipmentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'editing'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV file
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus('idle');
      setResults(null);
      setProgress(0);
    }
  };

  const handleUpload = async (file: File, pickupAddress?: any): Promise<void> => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!pickupAddress) {
      toast.error('Pickup address is required. Please set one in your settings.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setProgress(10);

    try {
      console.log('Starting file upload process');
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      console.log('Pickup address:', pickupAddress);

      // Read the file as text
      const text = await file.text();
      console.log('File read successfully, length:', text.length);
      
      setProgress(20);
      
      // Validate CSV structure
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Check CSV headers
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`CSV is missing required fields: ${missingFields.join(', ')}`);
      }
      
      setProgress(30);
      console.log('CSV validation passed');

      // Process file via the API
      console.log('Sending to process-bulk-upload function');
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: text,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to process bulk upload');
      }

      if (!data) {
        throw new Error('No data received from processing function');
      }

      console.log('Processing response:', data);
      setProgress(90);
      
      // Initialize the shipments with properly typed status
      const processedShipments: BulkShipment[] = data.processedShipments.map((shipment: any) => ({
        ...shipment,
        availableRates: shipment.availableRates || [],
        status: normalizeStatus(shipment.status || 'pending')
      }));

      const resultData = {
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        totalCost: data.totalCost,
        processedShipments,
        failedShipments: data.failedShipments || []
      };
      
      setResults(resultData);
      setUploadStatus('editing');
      setProgress(100);
      
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments with live rates.`);
      
      if (data.failedShipments && data.failedShipments.length > 0) {
        toast.error(`${data.failedShipments.length} shipments failed to process. Check the error details.`);
      }
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      
      let errorMessage = 'Failed to process the uploaded file';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
      'John Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Template downloaded successfully');
  };

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
