
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Check, AlertCircle, CreditCard, Loader } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProcessingResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
}

const BulkUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<ProcessingResult | null>(null);

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
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Read the file
      const text = await file.text();
      const rows = text.split('\n');
      
      // Validate the CSV format (simple check)
      if (rows.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Process file (in a real app, this would be handled by the backend)
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { csvContent: text }
      });

      if (error) throw new Error(error.message);

      setResults({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        totalCost: data.total * 4.99 // Assuming $4.99 per label
      });
      
      setUploadStatus('success');
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments`);
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      toast.error('Failed to process the uploaded file');
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
          description: `Bulk Shipping - ${results.successful} labels`
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
    
    // Simulate label creation
    setTimeout(() => {
      setIsCreatingLabels(false);
      toast.success(`${results.successful} shipping labels have been generated`);
      navigate('/dashboard?tab=tracking');
    }, 2000);
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
  };

  return (
    <Card className="p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <Upload className="mr-2" /> Bulk Shipping Upload
        </h2>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <FileText className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Upload a CSV file with multiple shipping addresses to create shipments in bulk.
          Make sure your CSV file follows the template format.
        </p>
        
        <div className="flex gap-4 items-center">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="max-w-md"
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : 'Process Upload'}
          </Button>
        </div>
      </div>
      
      {uploadStatus === 'success' && results && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
          <div className="flex items-center mb-2">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-semibold text-green-800">Upload Successful</h4>
          </div>
          <p className="text-green-700 mb-3">
            Successfully processed {results.successful} out of {results.total} shipments.
            {results.failed > 0 && ` (${results.failed} failed)`}
          </p>
          
          <div className="bg-white p-4 rounded-md border border-green-100">
            <h5 className="font-medium mb-2">Order Summary</h5>
            <div className="flex justify-between mb-1 text-sm">
              <span>Number of labels:</span>
              <span>{results.successful}</span>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <span>Price per label:</span>
              <span>$4.99</span>
            </div>
            <div className="flex justify-between font-medium mt-2 pt-2 border-t border-green-100">
              <span>Total:</span>
              <span>${results.totalCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={handleCreateLabels}
                disabled={isCreatingLabels}
              >
                {isCreatingLabels ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating Labels...
                  </>
                ) : 'Create Labels'}
              </Button>
              <Button 
                onClick={handleProceedToPayment}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${results.totalCost.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {uploadStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="font-semibold text-red-800">Upload Failed</h4>
          </div>
          <p className="text-red-700">
            There was an error processing your bulk upload. Please check the file format and try again.
          </p>
        </div>
      )}
    </Card>
  );
};

export default BulkUpload;
