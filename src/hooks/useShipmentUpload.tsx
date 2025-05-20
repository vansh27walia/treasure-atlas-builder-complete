
import { useState, useCallback, useRef } from 'react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import Papa from 'papaparse';
import { toast } from '@/components/ui/sonner';
import { pickupAddressService } from '@/services/PickupAddressService';

export const useShipmentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'editing' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const abortController = useRef(new AbortController());

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  }, []);

  const parseCSV = useCallback((csvFile: File): Promise<BulkShipment[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const shipments: BulkShipment[] = results.data.map((row: any, index) => {
              // Validate required fields
              if (!row.name || !row.street1 || !row.city || !row.state || !row.zip || !row.country) {
                throw new Error(`Row ${index + 1} is missing required address fields`);
              }

              return {
                id: `shipment-${index}`,
                row: index + 1,
                recipient: row.name,
                details: {
                  name: row.name,
                  company: row.company || '',
                  street1: row.street1,
                  street2: row.street2 || '',
                  city: row.city,
                  state: row.state,
                  zip: row.zip,
                  country: row.country,
                  phone: row.phone || '',
                  parcel_length: parseFloat(row.parcel_length) || undefined,
                  parcel_width: parseFloat(row.parcel_width) || undefined,
                  parcel_height: parseFloat(row.parcel_height) || undefined,
                  parcel_weight: parseFloat(row.parcel_weight) || undefined,
                },
                toAddress: {
                  name: row.name,
                  company: row.company || '',
                  street1: row.street1,
                  street2: row.street2 || '',
                  city: row.city,
                  state: row.state,
                  zip: row.zip,
                  country: row.country,
                  phone: row.phone || '',
                },
                parcel: {
                  length: parseFloat(row.parcel_length) || 10,
                  width: parseFloat(row.parcel_width) || 8,
                  height: parseFloat(row.parcel_height) || 2,
                  weight: parseFloat(row.parcel_weight) || 16,
                },
                availableRates: [],
                selectedRateId: null,
                status: 'pending'
              };
            });

            resolve(shipments);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }, []);

  const processUpload = useCallback(async (csvFile: File) => {
    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setProgress(10);

      // Get default from address
      const defaultAddress = await pickupAddressService.getDefaultAddress();
      if (!defaultAddress) {
        toast.error("No default pickup address found. Please set a default address in Settings.");
        setIsUploading(false);
        setUploadStatus('idle');
        return;
      }
      
      const fromAddress = {
        name: defaultAddress.name,
        company: defaultAddress.company || '',
        street1: defaultAddress.street1,
        street2: defaultAddress.street2 || '',
        city: defaultAddress.city,
        state: defaultAddress.state,
        zip: defaultAddress.zip,
        country: defaultAddress.country,
        phone: defaultAddress.phone || '',
      };
      
      setProgress(30);
      
      // Parse the CSV file
      const shipments = await parseCSV(csvFile);
      setProgress(60);
      
      // Create the result object
      const uploadResult: BulkUploadResult = {
        uploadStatus: 'editing',
        successful: shipments.length,
        failed: 0,
        total: shipments.length,
        processedShipments: shipments.map(s => ({ ...s, fromAddress })),
        failedShipments: [],
        totalCost: 0,
      };
      
      setProgress(100);
      setResults(uploadResult);
      setUploadStatus('editing');
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [parseCSV]);

  const handleUpload = useCallback(async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    await processUpload(file);
  }, [file, processUpload]);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = 'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight\nJohn Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const cancelUpload = useCallback(() => {
    abortController.current.abort();
    abortController.current = new AbortController();
    setIsUploading(false);
    setUploadStatus('idle');
    setProgress(0);
  }, []);

  return {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange,
    handleUpload,
    cancelUpload,
    handleDownloadTemplate
  };
};
