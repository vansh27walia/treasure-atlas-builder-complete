
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, MapPin, AlertCircle } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';

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
  handleUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addresses, isLoading: addressesLoading, loadAddresses } = usePickupAddresses();

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
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      await handleUpload(selectedFile);
      onUploadSuccess({ file: selectedFile });
    } catch (error) {
      console.error('Upload error:', error);
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `recipient_name,street_address,city,state,postal_code,country,weight_oz,length_in,width_in,height_in,description
John Doe,123 Main St,New York,NY,10001,US,16,12,8,6,Sample Product
Jane Smith,456 Oak Ave,Los Angeles,CA,90210,US,12,10,6,4,Another Product`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_shipping_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Select Pickup Address</h3>
        </div>
        
        {addressesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <span className="text-sm text-gray-600 mt-2">Loading addresses...</span>
          </div>
        ) : addresses.length === 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No pickup addresses found. Please add a pickup address in Settings first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                onClick={() => onPickupAddressSelect(address)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
              >
                <div className="font-medium text-gray-900">
                  {address.name || 'Unnamed Address'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {address.street1}
                </div>
                <div className="text-sm text-gray-500">
                  {address.city}, {address.state} {address.zip}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Enhanced CSV Upload Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="csv-file" className="text-lg font-semibold text-gray-900">
            Upload Your CSV File
          </Label>
          
          {/* Enhanced Drag & Drop Zone */}
          <div
            className={`relative cursor-pointer transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : selectedFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            } border-2 border-dashed rounded-xl p-12 text-center group`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleBoxClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="csv-file"
            />
            
            <div className="space-y-4">
              {selectedFile ? (
                <>
                  <FileText className="h-16 w-16 text-green-600 mx-auto group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xl font-semibold text-green-800">File Selected!</p>
                    <p className="text-lg text-green-600 mt-2">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-16 w-16 text-gray-400 mx-auto group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                      Click anywhere in this box to upload
                    </p>
                    <p className="text-gray-600 mb-4">
                      or drag and drop your CSV file here
                    </p>
                    <div className="text-sm text-gray-500">
                      Supported format: CSV files only
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Overlay for better click experience */}
            <div className="absolute inset-0 bg-transparent"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
          
          <Button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing... {progress > 0 && `${progress}%`}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload & Process CSV
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {isUploading && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BulkUploadForm;
