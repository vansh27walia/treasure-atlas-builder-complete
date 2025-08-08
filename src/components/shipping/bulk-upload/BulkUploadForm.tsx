
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import CsvHeaderMapper from './CsvHeaderMapper';

interface BulkUploadFormProps {
  onUploadComplete: (shipments: any[]) => void;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMapper, setShowMapper] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setParseError(null);
      parseCsvFile(selectedFile);
    }
  };

  const parseCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV parsing error: ${results.errors[0].message}`);
          toast.error('Failed to parse CSV file');
          return;
        }
        
        if (results.data.length === 0) {
          setParseError('CSV file is empty');
          toast.error('CSV file is empty');
          return;
        }

        setCsvData(results.data);
        setCsvHeaders(results.meta.fields || []);
        setShowMapper(true);
        toast.success(`CSV file parsed successfully. Found ${results.data.length} rows.`);
      },
      error: (error) => {
        setParseError(`Failed to parse CSV: ${error.message}`);
        toast.error('Failed to parse CSV file');
      }
    });
  };

  const handleMappingComplete = useCallback(async (mapping: Record<string, string>) => {
    setIsUploading(true);
    
    try {
      console.log('Processing CSV data with mapping:', mapping);
      
      // Transform CSV data using the mapping
      const transformedData = csvData.map((row, index) => {
        const transformedRow: any = {};
        
        // Apply mapping to transform CSV columns to expected fields
        Object.entries(mapping).forEach(([csvColumn, expectedField]) => {
          if (row[csvColumn] !== undefined) {
            transformedRow[expectedField] = row[csvColumn];
          }
        });
        
        // Add row index for tracking
        transformedRow._originalRowIndex = index + 2; // +2 because of header row and 0-based index
        
        return transformedRow;
      });

      console.log('Transformed data:', transformedData.slice(0, 2)); // Log first 2 rows

      // Validate required fields
      const requiredFields = ['recipient_name', 'recipient_street1', 'recipient_city', 'recipient_state', 'recipient_zip', 'weight'];
      const missingFields: string[] = [];
      
      transformedData.forEach((row, index) => {
        requiredFields.forEach(field => {
          if (!row[field] || row[field].toString().trim() === '') {
            if (!missingFields.includes(field)) {
              missingFields.push(field);
            }
          }
        });
      });

      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Pass the transformed data to the parent component
      onUploadComplete(transformedData);
      setShowMapper(false);
      toast.success(`Successfully processed ${transformedData.length} shipments`);
      
    } catch (error) {
      console.error('Error processing CSV data:', error);
      toast.error('Failed to process CSV data');
    } finally {
      setIsUploading(false);
    }
  }, [csvData, onUploadComplete]);

  const clearFile = () => {
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setShowMapper(false);
    setParseError(null);
  };

  if (showMapper && csvHeaders.length > 0) {
    return (
      <CsvHeaderMapper
        headers={csvHeaders}
        sampleData={csvData[0] || {}}
        onMappingComplete={handleMappingComplete}
        onCancel={() => setShowMapper(false)}
        isProcessing={isUploading}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="csv-upload">Choose CSV File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {file && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">File Selected</p>
                <p className="text-sm text-green-600">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>
          </div>
        )}

        {parseError && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            </div>
          </div>
        )}

        {csvData.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <p className="font-medium text-blue-800">CSV Parsed Successfully</p>
            </div>
            <p className="text-sm text-blue-600">
              Found {csvData.length} rows with {csvHeaders.length} columns
            </p>
            <div className="mt-2">
              <p className="text-xs text-blue-500">Columns detected:</p>
              <p className="text-xs text-blue-700 font-mono">
                {csvHeaders.join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Required columns: Recipient Name, Address, City, State, ZIP, Weight</li>
            <li>• Optional columns: Recipient Company, Address Line 2, Phone, Email</li>
            <li>• Weight should be in pounds (lbs)</li>
            <li>• One shipment per row</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUploadForm;
