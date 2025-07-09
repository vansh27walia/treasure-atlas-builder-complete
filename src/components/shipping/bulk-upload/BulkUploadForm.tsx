
import React, { useState, useEffect, useRef } from 'react';
import * as Papa from 'papaparse';
import { Upload, FileText, MapPin, AlertCircle, Loader2, X, Check, Brain, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { SavedAddress } from '@/services/AddressService';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';

// --- CsvHeaderMapper Component ---
interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({ csvContent, onMappingComplete, onCancel }) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Define expected headers
  const expectedHeaders = [
    { key: 'recipientName', label: 'Recipient Name', required: true },
    { key: 'street1', label: 'Street Address 1', required: true },
    { key: 'street2', label: 'Street Address 2', required: false },
    { key: 'city', label: 'City', required: true },
    { key: 'state', label: 'State', required: true },
    { key: 'zip', label: 'Zip Code', required: true },
    { key: 'country', label: 'Country', required: true, defaultValue: 'USA' },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone Number', required: false },
    { key: 'itemDescription', label: 'Item Description', required: false },
    { key: 'quantity', label: 'Quantity', required: false },
    { key: 'weight', label: 'Weight (lbs)', required: false },
  ];

  useEffect(() => {
    if (csvContent) {
      try {
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          preview: 5,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("CSV parsing errors:", results.errors);
              setError("Error parsing CSV: " + results.errors[0].message);
              return;
            }
            const headers = results.meta.fields || [];
            setCsvHeaders(headers);
            setPreviewData(results.data);

            // Attempt to auto-map common headers
            const initialMapping: { [key: string]: string } = {};
            expectedHeaders.forEach(expHeader => {
              const matchedCsvHeader = headers.find(csvH =>
                csvH.toLowerCase().includes(expHeader.key.toLowerCase()) ||
                csvH.toLowerCase().includes(expHeader.label.toLowerCase().replace(/\s/g, ''))
              );
              if (matchedCsvHeader) {
                initialMapping[expHeader.key] = matchedCsvHeader;
              }
            });
            setMapping(initialMapping);
            setError(null);
          },
        });
      } catch (e) {
        setError("Failed to parse CSV content. Please check file format.");
        console.error("CSV parse error:", e);
      }
    }
  }, [csvContent]);

  const handleMappingChange = (expectedKey: string, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [expectedKey]: csvHeader }));
  };

  const handleCompleteMapping = () => {
    setError(null);
    const missingRequired = expectedHeaders.filter(
      (expHeader) => expHeader.required && !mapping[expHeader.key] && expHeader.defaultValue === undefined
    );

    if (missingRequired.length > 0) {
      setError(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      toast({
        title: "Missing Required Fields",
        description: `Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error re-parsing CSV for conversion: " + results.errors[0].message);
          toast({
            title: "CSV Error",
            description: "Error re-parsing CSV for conversion: " + results.errors[0].message,
            variant: "destructive"
          });
          return;
        }

        const rawData = results.data;
        const convertedData = rawData.map(row => {
          const newRow: { [key: string]: any } = {};
          expectedHeaders.forEach(expHeader => {
            const mappedCsvHeader = mapping[expHeader.key];
            if (mappedCsvHeader && row[mappedCsvHeader] !== undefined) {
              newRow[expHeader.key] = row[mappedCsvHeader];
            } else if (expHeader.defaultValue !== undefined) {
              newRow[expHeader.key] = expHeader.defaultValue;
            } else {
              newRow[expHeader.key] = '';
            }
          });
          return newRow;
        });

        const finalCsv = Papa.unparse(convertedData, {
          header: true,
          columns: expectedHeaders.map(h => h.key)
        });

        onMappingComplete(finalCsv);
      },
    });
  };

  const handlePreviewMappedData = () => {
    setError(null);
    const mappedPreview = previewData.map(row => {
      const newRow: { [key: string]: any } = {};
      expectedHeaders.forEach(expHeader => {
        const mappedCsvHeader = mapping[expHeader.key];
        if (mappedCsvHeader && row[mappedCsvHeader] !== undefined) {
          newRow[expHeader.key] = row[mappedCsvHeader];
        } else if (expHeader.defaultValue !== undefined) {
          newRow[expHeader.key] = expHeader.defaultValue;
        } else {
          newRow[expHeader.key] = '';
        }
      });
      return newRow;
    });
    setPreviewData(mappedPreview);
    toast({
      title: "Preview Updated",
      description: "Preview updated with current mapping."
    });
  };

  return (
    <Card className="p-6">
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Map CSV Headers
          </h2>
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 mb-8">
          <p className="text-gray-700">
            Please map your CSV columns to the required fields below.
            <span className="font-semibold text-blue-600"> Required fields are marked with an asterisk (*).</span>
          </p>

          {expectedHeaders.map((expHeader) => (
            <div key={expHeader.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              <Label htmlFor={`map-${expHeader.key}`} className="font-semibold text-gray-700">
                {expHeader.label} {expHeader.required && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={mapping[expHeader.key] || ''}
                onValueChange={(value) => handleMappingChange(expHeader.key, value)}
              >
                <SelectTrigger id={`map-${expHeader.key}`} className="w-full col-span-2">
                  <SelectValue placeholder={`Select column for ${expHeader.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map(csvH => (
                    <SelectItem key={csvH} value={csvH}>
                      {csvH}
                    </SelectItem>
                  ))}
                  {expHeader.defaultValue !== undefined && (
                    <SelectItem value="" className="italic text-gray-500">
                      (Use default: {String(expHeader.defaultValue)})
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <Button onClick={handlePreviewMappedData} className="w-full mb-4 bg-gray-200 text-gray-800 hover:bg-gray-300">
            Preview Mapped Data
          </Button>
          <h3 className="text-lg font-semibold mb-2">Data Preview (First {previewData.length} rows)</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {expectedHeaders.map(header => (
                    <th key={header.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {expectedHeaders.map(expHeader => {
                      const mappedValue = row[expHeader.key] !== undefined ? row[expHeader.key] : '';
                      return (
                        <td key={`${rowIndex}-${expHeader.key}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                          {String(mappedValue)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {previewData.length === 0 && (
                  <tr>
                    <td colSpan={expectedHeaders.length} className="px-4 py-2 text-center text-sm text-gray-500">
                      No data to preview.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Button
          onClick={handleCompleteMapping}
          disabled={csvHeaders.length === 0 || error !== null}
          className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 text-lg font-bold shadow-md transform hover:scale-105 transition-all duration-200"
        >
          <Check className="mr-2 h-5 w-5" />
          Complete Mapping & Proceed
        </Button>
      </CardContent>
    </Card>
  );
};

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>;
}

type UploadStep = 'select' | 'mapping' | 'processing';

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const { addresses, selectedAddress, isLoading, isUpdating, addressCount, ADDRESS_LIMIT } = usePickupAddresses();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.is_default_from);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id.toString());
        onPickupAddressSelect(defaultAddress);
      } else {
        setSelectedAddressId(addresses[0].id.toString());
        onPickupAddressSelect(addresses[0]);
      }
    }
  }, [addresses, selectedAddressId, onPickupAddressSelect]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      onPickupAddressSelect(selectedAddress);
    }
  };

  const validateCSVFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File is too large. Maximum size is 10MB.",
        variant: "destructive"
      });
      return false;
    }
    if (file.size === 0) {
      toast({
        title: "Empty File",
        description: "The CSV file is empty. Please upload a valid CSV file.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateCSVFile(file)) {
      return false;
    }

    setSelectedFile(file);
    try {
      const text = await file.text();
      if (text.trim().length === 0) {
        toast({
          title: "Empty File",
          description: "The CSV file appears to be empty.",
          variant: "destructive"
        });
        return false;
      }
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least a header row and one data row.",
          variant: "destructive"
        });
        return false;
      }
      setCsvContent(text);
      setCurrentStep('mapping');
      toast({
        title: "File Loaded",
        description: "CSV file loaded! Now let's map the headers with AI assistance."
      });
      return true;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast({
        title: "File Error",
        description: "Error reading CSV file. Please make sure it's a valid CSV file.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleMappingComplete = async (convertedCsv: string) => {
    setCurrentStep('processing');
    try {
      const blob = new Blob([convertedCsv], { type: 'text/csv' });
      const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
        setCurrentStep('select');
        setSelectedFile(null);
        setCsvContent('');
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload failed after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setCurrentStep('select');
    }
  };

  const handleMappingCancel = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setCsvContent('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast({
      title: "Upload Cancelled",
      description: "CSV upload cancelled. You can select a new file."
    });
  };

  // Render header mapping step
  if (currentStep === 'mapping' && csvContent) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-6">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Header Mapping</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our advanced AI is analyzing your CSV headers and automatically mapping them to the correct shipping format.
            This ensures perfect compatibility with our shipping system.
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">Smart mapping in progress...</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border">
          <CsvHeaderMapper
            csvContent={csvContent}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
          />
        </div>
      </div>
    );
  }

  // Render processing step
  if (currentStep === 'processing') {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Shipments</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Creating shipments and fetching live rates from multiple carriers including UPS, USPS, FedEx, and DHL...
          </p>

          {progress > 0 && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Creating Shipments</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-purple-800">Fetching Rates</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              <span className="text-sm font-medium text-gray-600">Finalizing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render file selection step (default)
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="pickup-address" className="text-base font-semibold text-gray-900 mb-2 block">
                Select Pickup Address
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Choose the address where packages will be picked up from
              </p>

              {isLoading ? (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Loading your addresses...</span>
                </div>
              ) : addresses.length > 0 ? (
                <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          <span className="text-sm text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>No addresses found.</strong> Please add a pickup address in Settings first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${dragActive
                ? 'border-blue-400 bg-blue-50 scale-105'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="space-y-6">
              {selectedFile ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-green-700 mb-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600 mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB - Ready for AI processing
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>File validated successfully</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Drop your CSV file here
                    </p>
                    <p className="text-gray-600 mb-4">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        browse to choose a file
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setCsvContent('');
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                variant="outline"
                className="border-2 hover:border-blue-300"
              >
                Choose Different File
              </Button>
              <Button
                onClick={() => setCurrentStep('mapping')}
                disabled={!selectedAddressId || isLoading || isUploading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="mr-2 h-4 w-4" />
                Continue with AI Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about the process */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <AlertDescription className="text-blue-800">
              <strong className="font-semibold">Smart CSV Processing:</strong> Our AI automatically analyzes and maps your CSV headers to the correct shipping format. No manual field mapping required - just upload and let our intelligence handle the rest!
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default BulkUploadForm;
