
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import AddressSelector from '@/components/shipping/AddressSelector';

interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File) => Promise<void>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [showTemplateDownload, setShowTemplateDownload] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setShowTemplateDownload(false); // Hide template download after file selection
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setShowTemplateDownload(false); // Hide template download after file selection
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    try {
      await handleUpload(selectedFile);
      onUploadSuccess({ file: selectedFile, address: pickupAddress });
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleAddressSelect = (address: SavedAddress | null) => {
    setPickupAddress(address);
    onPickupAddressSelect(address);
  };

  const handleDownloadTemplate = () => {
    const csvContent = `recipient,street1,city,state_province,postal_code,country,weight_oz,length,width,height,value
John Doe,123 Main St,New York,NY,10001,US,16,10,8,6,25.00
Jane Smith,456 Oak Ave,Los Angeles,CA,90210,US,12,8,6,4,15.50`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_shipping_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Pickup Address Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Select Pickup Address</h3>
          </div>
          <AddressSelector
            onAddressSelect={handleAddressSelect}
            selectedAddress={pickupAddress}
          />
          {pickupAddress && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Pickup address selected: {pickupAddress.name || pickupAddress.street1}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Upload CSV File</h3>
            </div>

            {/* Template Download - Only show initially */}
            {showTemplateDownload && (
              <div className="mb-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>Need a template? Download our sample CSV file to get started.</span>
                      <Button
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        size="sm"
                        className="ml-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />

              <div className="space-y-4">
                {selectedFile ? (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-green-800">File Selected</p>
                      <p className="text-sm text-green-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop your CSV file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports CSV files up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading and processing...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || !pickupAddress || isUploading}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing ({progress}%)
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-3" />
                  Upload & Process CSV
                </>
              )}
            </Button>

            {/* Validation Messages */}
            {(!selectedFile || !pickupAddress) && (
              <div className="space-y-2">
                {!pickupAddress && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select a pickup address</span>
                  </div>
                )}
                {!selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select a CSV file to upload</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUploadForm;
