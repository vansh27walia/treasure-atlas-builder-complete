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
import { validateCsvStructure, REQUIRED_HEADERS, MANDATORY_HEADERS, parseCsvToRows, generateCsvFromRows } from '@/utils/csvValidator';

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

  // Enhanced file validation and AI conversion with better debugging
  const handleFileInputAndConvert = async (file: File) => {
    console.log('🔍 Starting file conversion for:', file.name);
    setSelectedFile(file);
    setCsvRows(null);
    setMissingData(false);
    setCsvEditMode(false);

    try {
      toast.info("Converting your file with AI...", { duration: 3000 });
      console.log('📤 Sending file to AI conversion service...');
      
      const formData = new FormData();
      formData.append("file", file);
      
      const { data, error } = await supabase.functions.invoke('ai-convert-upload', {
        body: formData,
      });

      console.log('📥 AI Conversion Response:', { data, error });

      if (error || (data && data.error) || !data?.convertedCsv) {
        let mainError = "AI conversion failed. Please try again.";
        let errorDetails = "The server returned an unexpected response.";

        if (error) {
            console.error("❌ Supabase Function Error:", error);
            mainError = typeof error.context?.error === 'string' ? error.context.error : "AI conversion service failed";
            errorDetails = typeof error.context?.details === 'string' ? error.context.details : error.message;
        } else if (data && data.error) {
            console.error("❌ Function-returned error:", data.error);
            mainError = data.error;
            errorDetails = data.details || 'No additional details provided.';
        }
        
        onUploadFail(`${mainError}: ${errorDetails}`);
        toast.error(mainError, {
            description: errorDetails,
            duration: 10000,
        });
        return;
      }

      console.log('✅ AI Conversion successful. CSV length:', data.convertedCsv.length);
      console.log('📝 First 500 chars of converted CSV:', data.convertedCsv.substring(0, 500));
      
      // Validate and parse CSV
      const validation = validateCsvStructure(data.convertedCsv);
      if (!validation.isValid) {
        console.error('❌ CSV Validation failed:', validation.error);
        toast.error(`CSV Validation failed: ${validation.error}`);
        onUploadFail(validation.error || 'Format error');
        return;
      }

      setCsvHeaders(validation.headers || REQUIRED_HEADERS);
      const rows = parseCsvToRows(data.convertedCsv);
      console.log('📊 Parsed CSV rows:', rows.length);
      console.log('🔍 Sample parsed rows:', rows.slice(0, 3));
      
      setCsvRows(rows);

      // Enhanced missing data detection with better feedback
      let hasEmpty = false;
      let missingFields: string[] = [];
      
      rows.forEach((row, index) => {
        MANDATORY_HEADERS.forEach(header => {
          const value = (row as any)[header];
          if (!value || value.toString().trim() === "") {
            hasEmpty = true;
            missingFields.push(`Row ${index + 2}: ${header}`);
          }
        });
      });

      if (hasEmpty) {
        console.log('⚠️ Missing data detected:', missingFields.slice(0, 10)); // Show first 10
        setMissingData(true);
        setCsvEditMode(true);
        toast.warning(`Missing required data in ${missingFields.length} fields. Please complete all required fields before proceeding.`, {
          description: `First few missing: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`,
          duration: 8000
        });
        return;
      } else {
        setMissingData(false);
        setCsvEditMode(false);
        toast.success(`✅ File converted successfully! ${rows.length} rows ready to process.`);
      }
    } catch (error) {
      console.error('💥 File conversion error:', error);
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

    // Enhanced validation before submission
    let hasMissing = false;
    let missingCount = 0;
    csvRows.forEach(row => {
      MANDATORY_HEADERS.forEach(header => {
        if (!(row as any)[header] || (row as any)[header].toString().trim() === "") {
          hasMissing = true;
          missingCount++;
        }
      });
    });

    if (hasMissing) {
      toast.error(`Please fill in all ${missingCount} missing required fields in your data first.`, {
        description: "Use the edit interface below to complete missing information.",
        duration: 8000
      });
      setCsvEditMode(true);
      setMissingData(true);
      return;
    }

    try {
      console.log('🚀 Starting upload process with', csvRows.length, 'rows');
      // Convert edited rows to CSV string and make file blob for uploading
      const csvString = generateCsvFromRows(csvRows);
      console.log('📝 Generated CSV preview:', csvString.substring(0, 300));
      
      const processedCsvFile = new File([csvString], "ready_to_upload.csv", { type: "text/csv" });
      
      if (handleUpload) {
        await handleUpload(processedCsvFile, pickupAddress);
        onUploadSuccess({});
        toast.success(`🎉 File processed successfully! ${csvRows.length} shipments uploaded.`);
      } else {
        onUploadFail("Upload handler not available");
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      onUploadFail(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Processing failed. Please check your file and try again.');
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
          onDragOver={handleDragOver}
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
            {selectedFile && csvRows && (
              <p className="text-xs text-green-600 mt-2">
                ✓ File converted successfully. {csvRows.length} rows found.
              </p>
            )}
            {missingData && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Some required data is missing. Please complete the fields below.
              </p>
            )}
          </div>
        </div>
        
        {csvEditMode && csvRows && csvHeaders && (
          <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
            <h4 className="font-medium text-orange-800 mb-2">Complete Missing Information</h4>
            <p className="text-sm text-orange-700 mb-4">
              Please fill in the missing required fields below. The system will automatically convert state names (like "California" → "CA") and validate addresses.
            </p>
            <CsvEditAndReview 
              rows={csvRows}
              headers={csvHeaders}
              requiredHeaders={MANDATORY_HEADERS}
              onDone={handleCsvEditAndReviewDone}
            />
          </div>
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
          {isUploading ? `Processing... (${progress}%)` : `Process ${csvRows?.length || 0} Shipments & Get Rates`}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;
