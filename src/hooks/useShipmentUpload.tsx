
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

// Standardized template download function
const downloadTemplate = () => {
  const csvContent = [
    'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
    'John Doe,ACME Inc,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16',
    'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8',
    'Bob Johnson,Global LLC,789 Pine St,,New York,NY,10001,US,5555551234,15,10,6,25'
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'bulk_shipping_template.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  toast.success('Template downloaded successfully');
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

  const handleUpload = async (file: File): Promise<void> => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setProgress(10); // Start progress

    try {
      // Convert file to base64 to send to edge function
      const reader = new FileReader();
      
      const fileReadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result?.toString();
          if (result) {
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      setProgress(20); // File reading started
      
      const base64Data = await fileReadPromise;
      setProgress(30); // File read complete
      
      // Get current pickup address (this should be passed from parent component)
      const pickupAddress = {
        name: "Default Pickup",
        street1: "123 Main St",
        city: "San Francisco", 
        state: "CA",
        zip: "94111",
        country: "US",
        phone: "555-555-5555"
      };

      setProgress(40); // Ready to process

      // Process file via the API - Fixed the function invocation
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          fileName: file.name,
          fileContent: base64Data,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProgress(90); // Processing complete
      
      // Initialize the shipments with empty available rates and properly typed status
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
      
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments. Ready for carrier selection.`);
      
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      
      // Show specific error message if available
      let errorMessage = 'Failed to process the uploaded file';
      let detailedErrors: string[] = [];
      
      if (error.cause?.detailedErrors) {
        detailedErrors = error.cause.detailedErrors;
      }
      
      if (error.cause?.details) {
        errorMessage = error.cause.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Store detailed errors for the error component
      setResults({
        total: 0,
        successful: 0,
        failed: 0,
        totalCost: 0,
        processedShipments: [],
        failedShipments: [],
        errorDetails: detailedErrors
      } as any);
      
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
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
