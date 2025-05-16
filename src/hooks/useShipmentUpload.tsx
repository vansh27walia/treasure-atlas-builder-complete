
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

  const handleUpload = async (file: File): Promise<void> => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setProgress(10); // Start progress

    try {
      // Read the file
      const text = await file.text();
      setProgress(20); // File read
      
      // Validate CSV structure
      const rows = text.split('\n');
      if (rows.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Check CSV headers
      const headers = rows[0].toLowerCase().split(',');
      const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`CSV is missing required fields: ${missingFields.join(', ')}`);
      }
      
      setProgress(30); // File validated

      // Process file and generate labels via the API
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: text,
          origin: {
            name: "Shipping Company",
            street1: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zip: "94111",
            country: "US",
            phone: "555-555-5555"
          }
        }
      });

      if (error) throw new Error(error.message);

      setProgress(90); // Processing complete
      
      // Initialize the shipments with empty available rates and properly typed status
      const processedShipments: BulkShipment[] = data.processedShipments.map((shipment: any) => ({
        ...shipment,
        availableRates: [],
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
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      toast.error(`Failed to process the uploaded file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight\nJohn Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16';
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
