
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertTriangle, Sparkles, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { SavedAddress } from '@/services/AddressService';
import { addressService } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';

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
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pickupAddresses, setPickupAddresses] = useState<SavedAddress[]>([]);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(null);
  const [showPickupSelector, setShowPickupSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load pickup addresses
  React.useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setPickupAddresses(addresses);
        
        // Auto-select default address
        const defaultAddr = addresses.find(addr => addr.is_default_from) || addresses[0];
        if (defaultAddr) {
          setSelectedPickupAddress(defaultAddr);
          onPickupAddressSelect(defaultAddr);
        } else {
          setShowPickupSelector(true);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };
    
    loadAddresses();
  }, [onPickupAddressSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    if (!selectedPickupAddress) {
      toast.error('Please select a pickup address');
      setShowPickupSelector(true);
      return;
    }

    try {
      await handleUpload(file);
      onUploadSuccess({ file: file.name });
    } catch (error) {
      console.error('Upload error:', error);
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const selectPickupAddress = (address: SavedAddress) => {
    setSelectedPickupAddress(address);
    onPickupAddressSelect(address);
    setShowPickupSelector(false);
    toast.success(`Selected pickup address: ${address.name || address.street1}`);
  };

  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      {!selectedPickupAddress && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-800">Pickup Address Required</h3>
            </div>
            <p className="text-orange-700 mb-4">
              Please select a pickup address for your shipments. This will be used as the "from" address for all labels.
            </p>
            <Button 
              onClick={() => setShowPickupSelector(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Select Pickup Address
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Pickup Address Display */}
      {selectedPickupAddress && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {selectedPickupAddress.name || 'Pickup Address'}
                  </p>
                  <p className="text-sm text-green-700">
                    {selectedPickupAddress.street1}, {selectedPickupAddress.city}, {selectedPickupAddress.state} {selectedPickupAddress.zip}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPickupSelector(true)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup Address Selector Modal */}
      {showPickupSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Select Pickup Address</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPickupSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {pickupAddresses.map((address) => (
                  <Card 
                    key={address.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => selectPickupAddress(address)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{address.name || 'Address'}</p>
                          <p className="text-sm text-gray-600">
                            {address.street1}
                            {address.street2 && `, ${address.street2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.zip}
                          </p>
                        </div>
                        {address.is_default_from && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {pickupAddresses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pickup addresses found.</p>
                    <p className="text-sm mt-2">
                      Please add a pickup address in Settings first.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Upload Area - ENHANCED to accept clicks anywhere */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
          ${file ? 'border-green-400 bg-green-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="space-y-6">
          <div className="flex justify-center">
            {file ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
            )}
          </div>
          
          <div>
            {file ? (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-800">File Selected!</h3>
                <p className="text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-700">
                  Click anywhere or drag & drop your CSV file
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Upload your CSV file with shipping data. Our AI will automatically map your columns and fetch the best rates.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Mapping
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    CSV Format
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h4 className="font-semibold text-blue-800">Processing Your File</h4>
                <p className="text-blue-600 text-sm">AI is analyzing and mapping your CSV data...</p>
              </div>
            </div>
            
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!file || !selectedPickupAddress || isUploading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-6 w-6" />
              Start AI Processing
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BulkUploadForm;
