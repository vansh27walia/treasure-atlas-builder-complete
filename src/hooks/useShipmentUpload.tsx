import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

// Helper function to validate and normalize status values
const normalizeStatus = (status: string): 'pending' | 'processing' | 'error' | 'completed' => {
  if (status === 'pending' || status === 'processing' || status === 'error' || status === 'completed') {
    return status;
  }
  if (status === 'created') return 'pending';
  if (status === 'success') return 'completed';
  if (status === 'failed') return 'error';
  return 'pending';
};

export const useShipmentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'editing' | 'creating-labels'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
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
      console.log('Starting EasyPost bulk upload process');
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      console.log('Pickup address:', pickupAddress);

      // Read the file as text
      const text = await file.text();
      console.log('File read successfully, length:', text.length);
      
      setProgress(20);
      
      // Validate CSV structure for EasyPost format
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Check EasyPost CSV headers
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredFields = ['to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country', 'weight', 'length', 'width', 'height'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`CSV is missing required EasyPost fields: ${missingFields.join(', ')}`);
      }
      
      setProgress(30);
      console.log('EasyPost CSV validation passed');

      // Process file via the EasyPost API integration
      console.log('Sending to EasyPost process-bulk-upload function');
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: text,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to process EasyPost bulk upload');
      }

      if (!data) {
        throw new Error('No data received from EasyPost processing function');
      }

      console.log('EasyPost processing response:', data);
      setProgress(90);
      
      // Initialize the shipments with properly typed status and customer details
      const processedShipments: BulkShipment[] = data.processedShipments.map((shipment: any) => ({
        ...shipment,
        availableRates: shipment.availableRates || [],
        status: normalizeStatus(shipment.status || 'pending'),
        customer_name: shipment.customer_name || shipment.details?.to_name || shipment.recipient,
        customer_address: shipment.customer_address || `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
        customer_phone: shipment.customer_phone || shipment.details?.to_phone,
        customer_email: shipment.customer_email || shipment.details?.to_email,
        customer_company: shipment.customer_company || shipment.details?.to_company,
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
      
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments using live EasyPost API with full carrier details.`);
      
      if (data.failedShipments && data.failedShipments.length > 0) {
        toast.error(`${data.failedShipments.length} shipments failed to process. Check the error details.`);
      }
      
    } catch (error) {
      console.error('EasyPost bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      
      let errorMessage = 'Failed to process the uploaded file with EasyPost';
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
      'to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference',
      'John Doe,JD Inc.,123 Test St,Apt 4,Los Angeles,CA,90001,US,555-555-5555,john@example.com,5.0,10,5,5,Order #1234',
      'Jane Smith,Acme Co.,456 Demo Rd,,New York,NY,10001,US,555-555-5556,jane@example.com,7.5,12,8,4,Order #1235',
      'Bob Johnson,Tech Corp,789 Pine St,,Miami,FL,33101,US,555-555-5557,bob@example.com,3.2,8,6,3,Order #1236'
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
    
    toast.success('EasyPost CSV template downloaded with all required fields for live carrier rates');
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
