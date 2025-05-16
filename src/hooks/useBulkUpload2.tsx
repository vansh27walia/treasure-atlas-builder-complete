
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

export const useBulkUpload2 = () => {
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

      // Process file individually by row rather than bulk
      // This approach processes each shipment as an individual request
      // Create an array of shipments from the CSV content
      const shipments: any[] = [];
      const failedShipments: any[] = [];
      
      // Skip header row (start at index 1)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue; // Skip empty rows
        
        const values = row.split(',');
        
        // Check if we have enough values for all required fields
        if (values.length < requiredFields.length) {
          failedShipments.push({
            row: i,
            error: 'Missing required fields',
            details: 'Row does not contain enough values for all required fields'
          });
          continue;
        }
        
        // Create a mapping of headers to values
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (index < values.length) {
            rowData[header] = values[index];
          }
        });
        
        // Add to shipments array with initial status
        shipments.push({
          id: `v2-${i}-${Date.now()}`,
          row: i,
          recipient: rowData.name,
          carrier: rowData.carrier || 'usps',
          service: rowData.service || 'Priority',
          rate: 4.99, // Default rate
          status: 'pending' as 'pending' | 'processing' | 'error' | 'completed',
          details: {
            name: rowData.name,
            company: rowData.company || '',
            street1: rowData.street1,
            street2: rowData.street2 || '',
            city: rowData.city,
            state: rowData.state,
            zip: rowData.zip,
            country: rowData.country,
            phone: rowData.phone || '',
            parcel_length: parseFloat(rowData.parcel_length) || 12,
            parcel_width: parseFloat(rowData.parcel_width) || 9,
            parcel_height: parseFloat(rowData.parcel_height) || 2,
            parcel_weight: parseFloat(rowData.parcel_weight) || 16,
          }
        });
      }
      
      setProgress(60); // Processing shipments
      
      // Calculate results summary
      const resultData: BulkUploadResult = {
        total: shipments.length + failedShipments.length,
        successful: shipments.length,
        failed: failedShipments.length,
        totalCost: shipments.length * 4.99, // Default cost per shipment
        processedShipments: shipments,
        failedShipments: failedShipments,
        uploadStatus: 'editing'
      };
      
      setResults(resultData);
      setUploadStatus('editing');
      setProgress(100);
      
      toast.success(`Successfully processed ${shipments.length} out of ${resultData.total} shipments. Ready for shipping.`);
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
    const csvContent = 'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight,carrier,service\nJohn Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16,usps,Priority';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'shipping_template_v2.csv');
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
