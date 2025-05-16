
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import BulkUploadForm2 from './BulkUploadForm2';
import BulkUploadResults from './BulkUploadResults';
import { useBulkUpload2 } from '@/hooks/useBulkUpload2';

const BulkUpload2: React.FC = () => {
  const {
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
  } = useBulkUpload2();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Bulk Upload</h2>
        <p className="text-gray-600 mb-6">
          Upload a CSV file with multiple shipping addresses to generate labels individually. 
          Each shipment will be processed separately for better tracking and error handling.
          You can specify carrier and service preferences in the CSV template.
        </p>

        {(!results || uploadStatus === 'idle') && (
          <BulkUploadForm2
            file={file}
            isUploading={isUploading}
            uploadProgress={progress}
            onFileChange={handleFileChange}
            onUpload={() => file && handleUpload(file)}
            onDownloadTemplate={handleDownloadTemplate}
          />
        )}

        {results && uploadStatus !== 'idle' && (
          <BulkUploadResults
            results={results}
            setResults={setResults}
            uploadStatus={uploadStatus}
            setUploadStatus={setUploadStatus}
          />
        )}
      </Card>
    </div>
  );
};

export default BulkUpload2;
