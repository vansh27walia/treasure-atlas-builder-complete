
import { useState, useCallback, useMemo } from 'react';
import { parse } from 'papaparse';
import { ShippingAddress, Parcel, BulkShipment, Rate, CustomsInfo, BulkUploadResult } from '@/types/shipping';
import { v4 as uuidv4 } from 'uuid';
import { SavedAddress } from '@/services/AddressService';

interface CSVRow {
  [key: string]: string;
}

interface ParsedCSVResult {
  data: CSVRow[];
  errors: any[];
  meta: any;
}

type SortField = 'recipient' | 'carrier' | 'rate' | 'customer_address';
type SortDirection = 'asc' | 'desc';

export const useBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [shipments, setShipments] = useState<BulkShipment[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'editing' | 'rates_fetching' | 'rate_selection' | 'paying' | 'creating-labels' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('recipient');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('all');

  const parseCSV = useCallback(async (file: File): Promise<ParsedCSVResult> => {
    return new Promise((resolve, reject) => {
      parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results as ParsedCSVResult);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }, []);

  const processCSVData = useCallback(async (csvData: CSVRow[]): Promise<BulkShipment[]> => {
    return csvData.map((row, index) => {
      const id = uuidv4();
      try {
        const toAddress: ShippingAddress = {
          name: row['to_name'] || '',
          company: row['to_company'] || '',
          street1: row['to_street1'] || '',
          street2: row['to_street2'] || '',
          city: row['to_city'] || '',
          state: row['to_state'] || '',
          zip: row['to_zip'] || '',
          country: row['to_country'] || 'US',
          phone: row['to_phone'] || '',
          email: row['to_email'] || '',
        };

        const parcel: Parcel = {
          length: parseFloat(row['parcel_length'] || '0'),
          width: parseFloat(row['parcel_width'] || '0'),
          height: parseFloat(row['parcel_height'] || '0'),
          weight: parseFloat(row['parcel_weight'] || '0'),
          predefinedPackage: row['parcel_predefined_package'] || undefined,
        };

        return {
          id: id,
          row: index + 1,
          recipient: toAddress.name || 'Unknown Recipient',
          customer_address: `${toAddress.city}, ${toAddress.state}`,
          details: {
            to_address: toAddress,
            parcel: parcel,
          },
          status: 'pending_rates',
          availableRates: [],
        } as BulkShipment;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        return {
          id: id,
          row: index + 1,
          recipient: 'Error',
          customer_address: 'Error',
          details: {
            to_address: {
              name: 'Error',
              street1: 'Error',
              city: 'Error',
              state: 'Error',
              zip: 'Error',
              country: 'Error',
            },
            parcel: {
              weight: 0,
              length: 0,
              width: 0,
              height: 0,
            },
          },
          status: 'error',
          error: 'Error processing data',
        } as BulkShipment;
      }
    });
  }, []);

  const filteredShipments = useMemo(() => {
    let filtered = [...shipments];

    if (searchTerm) {
      filtered = filtered.filter(shipment => 
        shipment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customer_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCarrierFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.carrier === selectedCarrierFilter);
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const stringA = String(aValue).toUpperCase();
      const stringB = String(bValue).toUpperCase();

      if (stringA < stringB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (stringA > stringB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [shipments, searchTerm, selectedCarrierFilter, sortField, sortDirection]);

  const handleUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setUploadStatus('uploading');
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const parsedResult = await parseCSV(uploadedFile);

      if (parsedResult.errors.length > 0) {
        setErrorMessage('Error parsing CSV file.');
        setUploadStatus('error');
        setIsUploading(false);
        console.error('CSV Parsing Errors:', parsedResult.errors);
        return;
      }

      const csvData = parsedResult.data;
      const newShipments = await processCSVData(csvData);

      setShipments(newShipments);
      setUploadStatus('editing');
      setIsUploading(false);

      // Create initial results
      setResults({
        total: newShipments.length,
        successful: 0,
        failed: 0,
        totalCost: 0,
        processedShipments: newShipments,
      });
    } catch (error) {
      setErrorMessage('Error uploading and processing CSV file.');
      setUploadStatus('error');
      setIsUploading(false);
      console.error('CSV Upload Error:', error);
    }
  }, [parseCSV, processCSVData]);

  const handleCreateLabels = useCallback(async () => {
    setIsCreatingLabels(true);
    // Simulate label creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreatingLabels(false);
    setUploadStatus('success');
  }, []);

  const handleDownloadAllLabels = useCallback(() => {
    console.log('Downloading all labels');
  }, []);

  const handleDownloadLabelsWithFormat = useCallback((format: string) => {
    console.log('Downloading labels with format:', format);
  }, []);

  const handleDownloadSingleLabel = useCallback((shipmentId: string) => {
    console.log('Downloading single label:', shipmentId);
  }, []);

  const handleEmailLabels = useCallback(() => {
    console.log('Emailing labels');
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    console.log('Downloading template');
  }, []);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    setShipments(prevShipments =>
      prevShipments.map(shipment => {
        if (shipment.id === shipmentId) {
          const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
          if (selectedRate) {
            return {
              ...shipment,
              selectedRateId: rateId,
              status: 'rate_selected',
              rate: selectedRate.rate,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
            };
          }
        }
        return shipment;
      })
    );

    // Update results
    setResults(prev => prev ? {
      ...prev,
      processedShipments: shipments.map(shipment => {
        if (shipment.id === shipmentId) {
          const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
          if (selectedRate) {
            return {
              ...shipment,
              selectedRateId: rateId,
              rate: selectedRate.rate,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
            };
          }
        }
        return shipment;
      })
    } : null);
  }, [shipments]);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    setShipments(prevShipments => 
      prevShipments.filter(shipment => shipment.id !== shipmentId)
    );
  }, []);

  const handleEditShipment = useCallback((shipment: BulkShipment) => {
    console.log('Editing shipment:', shipment);
  }, []);

  const handleRefreshRates = useCallback((shipmentId: string) => {
    console.log('Refreshing rates for:', shipmentId);
  }, []);

  const handleBulkApplyCarrier = useCallback((carrierFilter: string) => {
    console.log('Applying carrier filter:', carrierFilter);
  }, []);

  const updateShipment = useCallback((shipmentId: string, updatedFields: Partial<BulkShipment>) => {
    setShipments(prevShipments =>
      prevShipments.map(shipment =>
        shipment.id === shipmentId ? { ...shipment, ...updatedFields } : shipment
      )
    );
  }, []);

  const removeShipment = useCallback((shipmentId: string) => {
    setShipments(prevShipments => prevShipments.filter(shipment => shipment.id !== shipmentId));
  }, []);

  const setRatesForShipment = useCallback((shipmentId: string, rates: Rate[]) => {
    updateShipment(shipmentId, { availableRates: rates, status: 'rates_fetched' });
  }, [updateShipment]);

  const setSelectedRate = useCallback((shipmentId: string, rateId: string) => {
    const selectedRate = shipments.find(shipment => shipment.id === shipmentId)?.availableRates?.find(rate => rate.id === rateId);

    if (selectedRate) {
      updateShipment(shipmentId, {
        selectedRateId: rateId,
        status: 'rate_selected',
        rate: selectedRate.rate,
        carrier: selectedRate.carrier,
        service: selectedRate.service,
      });
    } else {
      console.error(`Rate with ID ${rateId} not found for shipment ${shipmentId}`);
    }
  }, [shipments, updateShipment]);

  const calculateBulkResults = useCallback((): BulkUploadResult => {
    const total = shipments.length;
    const successful = shipments.filter(shipment => shipment.status === 'rate_selected').length;
    const failed = shipments.filter(shipment => shipment.status === 'error').length;
    const totalCost = shipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);

    return {
      total,
      successful,
      failed,
      totalCost,
      processedShipments: shipments,
    };
  }, [shipments]);

  const resetBulkUpload = useCallback(() => {
    setShipments([]);
    setUploadStatus('idle');
    setErrorMessage(null);
    setPickupAddress(null);
    setFile(null);
    setResults(null);
  }, []);

  const updateShipmentCustoms = useCallback((shipmentId: string, customsInfo: CustomsInfo) => {
    setShipments(prev => prev.map(shipment => 
      shipment.id === shipmentId 
        ? { ...shipment, customs_info: customsInfo }
        : shipment
    ));
  }, []);

  return {
    file,
    shipments,
    uploadStatus,
    errorMessage,
    pickupAddress,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    results,
    progress,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    setPickupAddress,
    handleUpload,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    updateShipment,
    removeShipment,
    setRatesForShipment,
    setSelectedRate,
    calculateBulkResults,
    resetBulkUpload,
    updateShipmentCustoms
  };
};
