
import React from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';

const BulkUpload: React.FC = () => {
  const {
    isUploading,
    isPaying,
    isCreatingLabels,
    uploadStatus,
    results,
    progress,
    handleUpload,
    handleProceedToPayment,
    handleDownloadAllLabels,
    handleDownloadSingleLabel,
    handleDownloadTemplate
  } = useBulkUpload();

  return (
    <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
      <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
      
      <BulkUploadForm 
        onUpload={handleUpload}
        isUploading={isUploading}
        progress={progress}
      />
      
      {uploadStatus === 'success' && results && (
        <SuccessNotification
          results={results}
          onDownloadAllLabels={handleDownloadAllLabels}
          onDownloadSingleLabel={handleDownloadSingleLabel}
          onProceedToPayment={handleProceedToPayment}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
      )}
      
      {uploadStatus === 'error' && (
        <UploadError />
      )}
    </Card>
  );
};

export default BulkUpload;
