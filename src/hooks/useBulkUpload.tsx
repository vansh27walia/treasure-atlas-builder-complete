
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkUploadData {
  [key: string]: any;
}

export const useBulkUpload = () => {
  const [uploadedData, setUploadedData] = useState<BulkUploadData[] | null>(null);
  const [mappedData, setMappedData] = useState<any[] | null>(null);
  const [ratesData, setRatesData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: BulkUploadData = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
      
      setUploadedData(data);
      toast.success(`Successfully uploaded ${data.length} records`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnMapping = async (mapping: { [key: string]: string }) => {
    if (!uploadedData) {
      setError('No uploaded data available for mapping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mapped = uploadedData.map(row => {
        const mappedRow: any = {};
        Object.entries(mapping).forEach(([requiredField, csvColumn]) => {
          mappedRow[requiredField] = row[csvColumn] || '';
        });
        return mappedRow;
      });

      setMappedData(mapped);
      toast.success('Column mapping completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to map columns';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatesFetch = async () => {
    if (!mappedData) {
      setError('No mapped data available for rate fetching');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching rates for mapped data:', mappedData);
      
      const { data, error: ratesError } = await supabase.functions.invoke('get-bulk-rates', {
        body: { shipments: mappedData }
      });

      if (ratesError) {
        throw new Error(ratesError.message || 'Failed to fetch rates');
      }

      if (data && data.rates) {
        setRatesData(data.rates);
        toast.success(`Rates fetched for ${data.rates.length} shipments`);
      } else {
        throw new Error('No rates data returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkLabelCreation = async () => {
    if (!ratesData) {
      setError('No rates data available for label creation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating bulk labels for rates:', ratesData);
      
      const { data, error: labelError } = await supabase.functions.invoke('create-bulk-labels', {
        body: { 
          shipments: ratesData,
          labelOptions: {
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (labelError) {
        throw new Error(labelError.message || 'Failed to create labels');
      }

      if (data && data.success) {
        toast.success(`Successfully created ${data.successful} labels`);
        return data;
      } else {
        throw new Error('Label creation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create labels';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetUpload = () => {
    setUploadedData(null);
    setMappedData(null);
    setRatesData(null);
    setError(null);
  };

  return {
    uploadedData,
    mappedData,
    ratesData,
    isLoading,
    error,
    handleFileUpload,
    handleColumnMapping,
    handleRatesFetch,
    handleBulkLabelCreation,
    resetUpload
  };
};
