
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkUploadView from './bulk-upload/BulkUploadView';
import BatchLabelCreationPage from './bulk-upload/BatchLabelCreationPage';
import BulkUploadProgressBar, { BulkUploadStep } from './bulk-upload/BulkUploadProgressBar';
import { BulkUploadResult } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';

const BulkUpload: React.FC = () => {
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(null);
  const [currentStep, setCurrentStep] = useState<BulkUploadStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<BulkUploadStep[]>([]);
  const [batchResults, setBatchResults] = useState<BulkUploadResult | null>(null);
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);

  const completeStep = (step: BulkUploadStep) => {
    setCompletedSteps(prev => [...prev.filter(s => s !== step), step]);
  };

  const moveToStep = (step: BulkUploadStep) => {
    setCurrentStep(step);
  };

  const handleUpload = useCallback(async (file: File): Promise<any> => {
    if (!selectedPickupAddress) {
      throw new Error('Please select a pickup address first');
    }

    console.log('BulkUpload: Starting upload with pickup address:', selectedPickupAddress);
    
    setIsUploading(true);
    setUploadProgress(0);
    completeStep('upload');
    moveToStep('mapping');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pickup_address', JSON.stringify(selectedPickupAddress));

      console.log('BulkUpload: Calling process-bulk-csv function...');

      // Use the existing process-bulk-csv function
      const { data, error } = await supabase.functions.invoke('process-bulk-csv', {
        body: formData
      });

      if (error) {
        console.error('BulkUpload: Error from process-bulk-csv:', error);
        throw new Error(error.message || 'Failed to process CSV file');
      }

      console.log('BulkUpload: Received response from process-bulk-csv:', data);

      if (data && data.success) {
        completeStep('mapping');
        moveToStep('rates');
        setUploadResults(data);
        setUploadProgress(100);
        toast.success(`Successfully processed ${data.successful || 0} shipments`);
        return data;
      } else {
        throw new Error(data?.message || 'Failed to process CSV file');
      }

    } catch (error) {
      console.error('BulkUpload: Upload failed:', error);
      setCurrentStep('upload');
      setCompletedSteps([]);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [selectedPickupAddress]);

  const handleUploadSuccess = (results: any) => {
    console.log('BulkUpload: Upload successful:', results);
    setUploadResults(results);
    completeStep('rates');
    moveToStep('labels');
  };

  const handleUploadFail = (error: string) => {
    console.error('BulkUpload: Upload failed:', error);
    toast.error(error);
    setCurrentStep('upload');
    setCompletedSteps([]);
    setIsUploading(false);
  };

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    console.log('BulkUpload: Pickup address selected:', address);
    setSelectedPickupAddress(address);
  };

  const handleBatchProcessed = (result: BulkUploadResult) => {
    console.log('BulkUpload: Batch processed:', result);
    setBatchResults(result);
    completeStep('labels');
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    console.log('BulkUpload: Downloading label:', labelUrl);
    
    // Create a temporary link element to download the file
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `label_${Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Label downloaded successfully');
  };

  // If we have batch results, show the batch label creation page
  if (batchResults) {
    return (
      <BatchLabelCreationPage
        results={batchResults}
        onDownloadSingleLabel={handleDownloadSingleLabel}
        batchPrintPreviewModalOpen={batchPrintPreviewModalOpen}
        setBatchPrintPreviewModalOpen={setBatchPrintPreviewModalOpen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
      {/* Progress Bar */}
      <BulkUploadProgressBar 
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Main Content */}
      <div className="w-full">
        {!uploadResults ? (
          // Upload Form Stage
          <div className="max-w-6xl mx-auto px-6 pb-8">
            <BulkUploadForm
              onUploadSuccess={handleUploadSuccess}
              onUploadFail={handleUploadFail}
              onPickupAddressSelect={handlePickupAddressSelect}
              isUploading={isUploading}
              progress={uploadProgress}
              handleUpload={handleUpload}
            />
          </div>
        ) : (
          // Results View Stage - Use BulkUploadView without props
          <div className="w-full">
            <BulkUploadView />
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
