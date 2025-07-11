
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import { toast } from 'sonner';
import BatchLabelCreationPage from './bulk-upload/BatchLabelCreationPage';

const BulkUpload: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'rates' | 'creation'>('upload');
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    isCreatingLabels,
    handleFileChange,
    handleUpload
  } = useBulkUpload();

  const handleNextStep = () => {
    if (currentStep === 'upload' && results) {
      setCurrentStep('mapping');
    } else if (currentStep === 'mapping' && results) {
      setCurrentStep('rates');
    } else if (currentStep === 'rates' && results) {
      setCurrentStep('creation');
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'creation') {
      setCurrentStep('rates');
    } else if (currentStep === 'rates') {
      setCurrentStep('mapping');
    } else if (currentStep === 'mapping') {
      setCurrentStep('upload');
    }
  };

  if (currentStep === 'creation' && results?.processedShipments) {
    return (
      <BatchLabelCreationPage
        shipments={results.processedShipments}
        onBack={handleBackStep}
        onBatchProcessed={(result) => {
          console.log('Batch processed:', result);
          toast.success('Batch labels created successfully!');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span>Upload</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'mapping' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'mapping' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span>Mapping</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'rates' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'rates' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span>Rates</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center space-x-2 ${currentStep === 'creation' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'creation' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span>Creation</span>
        </div>
      </div>

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported format: CSV files with shipping information
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button asChild className="cursor-pointer">
                    <span>Choose File</span>
                  </Button>
                </label>
                {file && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Selected: {file.name}</p>
                    <Button onClick={() => handleUpload(file)} className="w-full">
                      Upload File
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
                  <FileText className="mr-2 h-5 w-5" />
                  <span>File uploaded successfully! {results.total} rows detected.</span>
                </div>
                <Button onClick={handleNextStep} className="w-full">
                  Continue to Mapping
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {uploadStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>Error uploading file</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {(isUploading || isCreatingLabels) && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Processing...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUpload;
