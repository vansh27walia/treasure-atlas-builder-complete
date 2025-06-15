import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileUp, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import SelectAddressDropdown from '../SelectAddressDropdown';
import AddressForm from '../AddressForm';
import { addressService, SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import CsvEditAndReview from './CsvEditAndReview';
import { validateCsvStructure, REQUIRED_HEADERS } from '@/utils/csvValidator';
import { parseCsvToRows, generateCsvFromRows } from '@/utils/csvValidator';

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File, pickupAddress: SavedAddress | null) => Promise<any>; 
}

const SUPPORTED_EXTS = [".csv", ".xls", ".xlsx", ".doc", ".docx", ".txt", ".json", ".xml"];

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ 
  onUploadSuccess, 
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [csvRows, setCsvRows] = useState<any[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[] | null>(null);
  const [missingData, setMissingData] = useState<boolean>(false);
  const [csvEditMode, setCsvEditMode] = useState<boolean>(false);

  // Load saved addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log('Loading addresses in BulkUploadForm...');
        const savedAddresses = await addressService.getSavedAddresses();
        console.log('Loaded addresses:', savedAddresses);
        setAddresses(savedAddresses);
        
        // If there's a default from address, select it
        const defaultFromAddress = savedAddresses.find(addr => addr.is_default_from);
        if (defaultFromAddress) {
          console.log('Setting default pickup address:', defaultFromAddress);
          setPickupAddress(defaultFromAddress);
          onPickupAddressSelect(defaultFromAddress);
        } else if (savedAddresses.length > 0) {
          // Use first address if no default
          const firstAddress = savedAddresses[0];
          console.log('No default found, using first address:', firstAddress);
          setPickupAddress(firstAddress);
          onPickupAddressSelect(firstAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Error loading pickup addresses');
      }
    };
    
    loadAddresses();
  }, [onPickupAddressSelect]);

  // File validation and AI conversion, always process via AI function
  const handleFileInputAndConvert = async (file: File) => {
    setSelectedFile(file);
    setCsvRows(null);
    setMissingData(false);
    setCsvEditMode(false);

    // Always convert with AI
    try {
      toast.info("Attempting to convert your file with AI...", { duration: 2000 });
      const formData = new FormData();
      formData.append("file", file);
      // Use ai-convert-upload edge function for all file types
      const { data, error } = await supabase.functions.invoke('ai-convert-upload', {
        body: formData,
      });

      if (error || (data && data.error) || !data?.convertedCsv) {
        let mainError = "AI conversion failed. Please try again.";
        let errorDetails = "The server returned an unexpected response.";

        if (error) { // This is a FunctionError from Supabase client
            console.error("Supabase Function Error:", error);
            mainError = typeof error.context?.error === 'string' ? error.context.error : "AI conversion service failed";
            errorDetails = typeof error.context?.details === 'string' ? error.context.details : error.message;
        } else if (data && data.error) { // This is a handled error from the function's logic
            console.error("Function-returned error:", data.error);
            mainError = data.error;
            errorDetails = data.details || 'No additional details provided.';
        }
        
        onUploadFail(`${mainError}: ${errorDetails}`);
        toast.error(mainError, {
            description: errorDetails,
            duration: 10000, // Show for 10 seconds
        });
        return;
      }
      // Validate and parse CSV
      const validation = validateCsvStructure(data.convertedCsv);
      if (!validation.isValid) {
        toast.error(`CSV Validation failed: ${validation.error}`);
        onUploadFail(validation.error || 'Format error');
        return;
      }
      setCsvHeaders(validation.headers || REQUIRED_HEADERS);
      const rows = parseCsvToRows(data.convertedCsv);
      setCsvRows(rows);

      // Check for missing data
      let hasEmpty = false;
      rows.forEach(row => {
        REQUIRED_HEADERS.forEach(header => {
          if (!row[header] || row[header].trim() === "") {
            hasEmpty = true;
          }
        });
      });
      if (hasEmpty) {
        setMissingData(true);
        setCsvEditMode(true);
        toast.error('Some required data is missing. Please complete all fields.');
        return;
      } else {
        setMissingData(false);
        setCsvEditMode(false);
        // Ready to process
        toast.success('CSV is valid and ready to process!');
      }
    } catch (error) {
      toast.error(`Could not read/convert file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSelectedFile(null);
      setCsvRows(null);
      setMissingData(false);
      setCsvEditMode(false);
    }
  };

  // Change file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      e.target.value = "";
      return;
    }
    handleFileInputAndConvert(file);
  };

  // Drag & drop handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }
      handleFileInputAndConvert(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !csvRows) {
      toast.error('Please select and review a file before submitting');
      return;
    }
    if (!pickupAddress) {
      toast.error('Please select a pickup address or add one in Settings');
      return;
    }
    // Check for missing
    let hasMissing = false;
    csvRows.forEach(row => {
      REQUIRED_HEADERS.forEach(header => {
        if (!row[header] || row[header].toString().trim() === "") {
          hasMissing = true;
        }
      });
    });
    if (hasMissing) {
      toast.error("Please fill in all missing fields in your data first.");
      setCsvEditMode(true);
      setMissingData(true);
      return;
    }
    try {
      // Convert edited rows to CSV string and make file blob for uploading
      const csvString = generateCsvFromRows(csvRows);
      const processedCsvFile = new File([csvString], "ready_to_upload.csv", { type: "text/csv" });
      if (handleUpload) {
        await handleUpload(processedCsvFile, pickupAddress);
        onUploadSuccess({});
        toast.success('🎉 File processed and uploaded successfully!');
      } else {
        onUploadFail("Upload handler not available");
      }
    } catch (error) {
      onUploadFail(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Processing failed. Please check your file.');
    }
  };

  const handleAddressSubmit = async (values: any) => {
    try {
      console.log('Creating new address:', values);
      
      const newAddress = await addressService.createAddress({
        name: values.name || '',
        company: values.company || '',
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country || 'US',
        phone: values.phone || '',
        is_default_from: values.is_default_from || false,
        is_default_to: values.is_default_to || false
      }, true);
      
      if (newAddress) {
        toast.success('Address saved successfully');
        
        if (values.is_default_from) {
          await addressService.setDefaultFromAddress(newAddress.id);
        }
        
        // Update the local addresses list
        setAddresses(prev => [newAddress, ...prev]);
        
        // Select the newly created address
        setPickupAddress(newAddress);
        onPickupAddressSelect(newAddress);
        setShowAddNewAddress(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handlePickupAddressChange = (address: SavedAddress | null) => {
    console.log('Pickup address changed in form:', address);
    setPickupAddress(address);
    onPickupAddressSelect(address);
  };

  const handleCsvEditAndReviewDone = (rows: any[]) => {
    setCsvRows(rows);
    setCsvEditMode(false);
    setMissingData(false);
    toast.success("All missing data filled—ready to proceed!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pickup Address</h3>
        {showAddNewAddress ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Add New Address</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddNewAddress(false)}
                >
                  Cancel
                </Button>
              </div>
              <AddressForm 
                onSubmit={handleAddressSubmit} 
                buttonText="Save Address" 
                isPickupAddress={true}
                showDefaultOptions={true}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <SelectAddressDropdown
              onAddressSelected={handlePickupAddressChange}
              onAddNew={() => setShowAddNewAddress(true)}
              placeholder="Select a pickup address"
              isPickupAddress={true}
              defaultAddress={pickupAddress}
              className="w-full"
            />
            {!pickupAddress && addresses.length === 0 && (
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>No pickup addresses found.</strong> You need to add a pickup address before uploading files. 
                  Click "Add new address" above or go to Settings to add one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload File</h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-blue-50"
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="*"
            className="hidden"
            onChange={handleFileChange}
          />
          <CloudUpload className="h-16 w-16 text-gray-400 mb-4" />
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {selectedFile 
                ? `Selected: ${selectedFile.name}` 
                : 'Drag & drop your file here or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Supported: CSV, Excel, DOC(X), TXT, JSON, XML (up to 10MB)
            </p>
            <p className="text-xs text-blue-600 font-medium">
              💡 AI auto-converts your file to the right shipping format!
            </p>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-2">
                ✓ File converted. Review/edit below if needed.
              </p>
            )}
          </div>
        </div>
        {csvEditMode && csvRows && csvHeaders && (
          <CsvEditAndReview 
            rows={csvRows}
            headers={csvHeaders}
            requiredHeaders={REQUIRED_HEADERS}
            onDone={handleCsvEditAndReviewDone}
          />
        )}
        {isUploading && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!selectedFile || !csvRows || isUploading || missingData}
          className="flex items-center gap-2 px-8 py-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {isUploading ? `Processing... (${progress}%)` : 'Process File & Get Rates'}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;
