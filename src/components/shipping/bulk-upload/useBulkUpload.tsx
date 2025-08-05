import { useState, useCallback } from 'react';
import { parse } from 'papaparse';
import { ShippingAddress, Parcel, BulkShipment, Rate, CustomsInfo } from '@/types/shipping';
import { v4 as uuidv4 } from 'uuid';

interface CSVRow {
  [key: string]: string;
}

interface ParsedCSVResult {
  data: CSVRow[];
  errors: any[];
  meta: any;
}

interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: BulkShipment[];
}

export const useBulkUpload = () => {
  const [shipments, setShipments] = useState<BulkShipment[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'editing' | 'rates_fetching' | 'rate_selection' | 'paying' | 'creating-labels' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState<ShippingAddress | null>(null);

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
          country: row['to_country'] || '',
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
          details: {
            to_address: toAddress,
            parcel: parcel,
          },
          status: 'pending_rates',
        } as BulkShipment;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        return {
          id: id,
          row: index + 1,
          recipient: 'Error',
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

  const uploadCSV = useCallback(async (file: File) => {
    setUploadStatus('uploading');
    setErrorMessage(null);

    try {
      const parsedResult = await parseCSV(file);

      if (parsedResult.errors.length > 0) {
        setErrorMessage('Error parsing CSV file.');
        setUploadStatus('error');
        console.error('CSV Parsing Errors:', parsedResult.errors);
        return;
      }

      const csvData = parsedResult.data;
      const newShipments = await processCSVData(csvData);

      setShipments(newShipments);
      setUploadStatus('editing');
    } catch (error) {
      setErrorMessage('Error uploading and processing CSV file.');
      setUploadStatus('error');
      console.error('CSV Upload Error:', error);
    }
  }, [parseCSV, processCSVData]);

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
  }, []);

  const updateShipmentCustoms = (shipmentId: string, customsInfo: CustomsInfo) => {
    setShipments(prev => prev.map(shipment => 
      shipment.id === shipmentId 
        ? { ...shipment, customs_info: customsInfo }
        : shipment
    ));
  };

  return {
    shipments,
    uploadStatus,
    errorMessage,
    pickupAddress,
    setPickupAddress,
    uploadCSV,
    updateShipment,
    removeShipment,
    setRatesForShipment,
    setSelectedRate,
    calculateBulkResults,
    resetBulkUpload,
    updateShipmentCustoms
  };
};
