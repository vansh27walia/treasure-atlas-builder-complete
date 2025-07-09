
import React, { useState, useEffect, useRef } from 'react';
import * as Papa from 'papaparse';
import { Upload, FileText, MapPin, AlertCircle, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
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
      toast.error(`Please map all required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError("Error re-parsing CSV for conversion: " + results.errors[0].message);
          toast.error("Error re-parsing CSV for conversion: " + results.errors[0].message);
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
    toast.info("Preview updated with current mapping.");
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

// --- BulkUploadForm Component ---
export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const { addresses: availableAddresses, loading: addressesLoading } = usePickupAddresses();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);

  // Load addresses and set default
  useEffect(() => {
    if (availableAddresses && availableAddresses.length > 0) {
      const defaultAddress = availableAddresses.find(addr => addr.is_default_from);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id.toString());
        onPickupAddressSelect(defaultAddress);
      } else if (availableAddresses.length > 0) {
        setSelectedAddressId(availableAddresses[0].id.toString());
        onPickupAddressSelect(availableAddresses[0]);
      }
    }
  }, [availableAddresses, onPickupAddressSelect]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses?.find(addr => addr.id.toString() === addressId);
    onPickupAddressSelect(selectedAddress || null);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setShowHeaderMapper(true);
    };
    reader.readAsText(file);
    return true;
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
    console.log('Header mapping complete, proceeding with converted CSV');

    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });

    try {
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
        setShowHeaderMapper(false);
        setSelectedFile(null);
        setCsvContent('');
        // Reset file input for re-selection
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        onUploadFail('Upload handler not available');
        toast.error('Upload handler not available');
      }
    } catch (error) {
      console.error('Upload error after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process converted file';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('CSV header mapping cancelled.');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const currentPickupAddress = availableAddresses?.find(addr => addr.id.toString() === selectedAddressId);
    if (!currentPickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    toast.info("Please select a CSV file to proceed with mapping.");
  };

  if (showHeaderMapper && csvContent) {
    return (
      <div className="space-y-6">
        <CsvHeaderMapper
          csvContent={csvContent}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <Label className="text-lg font-medium">Select Pickup Address</Label>
        </div>

        {addressesLoading ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Loading pickup addresses...</span>
          </div>
        ) : availableAddresses && availableAddresses.length > 0 ? (
          <div className="flex justify-center">
            <Select value={selectedAddressId} onValueChange={handleAddressChange} disabled={isUploading}>
              <SelectTrigger className="w-full max-w-md p-4 text-left bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose your pickup address" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {availableAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()} className="hover:bg-gray-50 cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium">{address.name}</span>
                      <span className="text-sm text-gray-600">
                        {address.street1}, {address.city}, {address.state} {address.zip}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No pickup addresses found. Please add a pickup address in Settings before uploading.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Upload CSV File</Label>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || showHeaderMapper}
          />

          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              selectedFile ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {selectedFile ? (
                <FileText className="h-8 w-8 text-white" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-lg font-semibold text-green-800">File Selected</p>
                <p className="text-green-600">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                {showHeaderMapper && (
                    <p className="text-orange-600 text-sm mt-2">
                        Please complete header mapping below.
                    </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-gray-500 mt-2">
                  Supports CSV files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && progress > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedFile || !selectedAddressId || isUploading || showHeaderMapper}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            Processing Upload...
          </>
        ) : (
          <>
            <Upload className="mr-3 h-6 w-6" />
            Upload & Process CSV
          </>
        )}
      </Button>
    </div>
  );
};

export default BulkUploadForm;
