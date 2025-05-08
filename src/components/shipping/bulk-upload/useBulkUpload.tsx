
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

interface ProcessedShipment {
  id: string;
  tracking_code: string;
  label_url: string;
  status: string;
  row: number;
  recipient: string;
  carrier: string;
}

interface FailedShipment {
  row: number;
  error: string;
  details: string;
}

interface ProcessingResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: ProcessedShipment[];
  failedShipments: FailedShipment[];
}

export const useBulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<ProcessingResult | null>(null);
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

  const handleUpload = async (file: File) => {
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

      setResults({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        totalCost: data.totalCost,
        processedShipments: data.processedShipments || [],
        failedShipments: data.failedShipments || []
      });
      
      setUploadStatus('success');
      setProgress(100);
      
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments and generated labels`);
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      toast.error(`Failed to process the uploaded file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!results) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Calculate total amount in cents for Stripe
      const amountInCents = Math.round(results.totalCost * 100);
      
      // Create checkout session with Stripe
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          amount: amountInCents,
          quantity: results.successful,
          description: `Bulk Shipping - ${results.successful} labels`,
          metadata: {
            shipment_ids: results.processedShipments.map(s => s.id).join(',')
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = () => {
    if (!results) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    // Labels are already generated, just simulate completion
    setTimeout(() => {
      setIsCreatingLabels(false);
      toast.success(`${results.successful} shipping labels have been generated`);
      navigate('/dashboard?tab=tracking');
    }, 1000);
  };

  const handleDownloadAllLabels = () => {
    if (!results || !results.processedShipments.length) {
      toast.error('No labels available to download');
      return;
    }
    
    // In a real app, this would download a ZIP file with all labels
    // For this demo, we'll open the first label URL as an example
    toast.success(`Preparing ${results.successful} labels for download`);
    window.open(results.processedShipments[0].label_url, '_blank');
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
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
    isPaying,
    isCreatingLabels,
    uploadStatus,
    results,
    progress,
    handleFileChange,
    handleUpload,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadSingleLabel,
    handleDownloadTemplate
  };
};
