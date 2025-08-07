
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment, ShipmentDetails, AddressDetails } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';
import { parseCsvFile } from '@/utils/csvParser';

interface UploadResults {
  total: number;
  successful: number;
  failed: number;
  processedShipments: BulkShipment[];
  totalCost?: number;
}

// Helper function to standardize address
const standardizeAddress = async (fullAddress: string, city: string, state: string, zip: string): Promise<AddressDetails> => {
  // Simple address object creation for now
  return {
    street1: fullAddress || '',
    city: city || '',
    state: state || '',
    zip: zip || '',
    country: 'US'
  };
};

export const useBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'editing' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'carrier' | 'rate'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string>('all');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);

  const handleUpload = async (file: File) => {
    setFile(file);
    setIsUploading(true);
    setUploadStatus('uploading');
    setProgress(0);

    try {
      const parsedData = await parseCsvFile(file, setProgress);
      console.log("Parsed CSV Data:", parsedData);

      // Standardize addresses and prepare shipments
      const shipments = await Promise.all(
        parsedData.map(async (item, index) => {
          try {
            const standardized = await standardizeAddress(
              item.customer_address || `${item.customer_street}, ${item.customer_city}, ${item.customer_state} ${item.customer_zip}`,
              item.customer_city,
              item.customer_state,
              item.customer_zip
            );

            const shipmentDetails: ShipmentDetails = {
              to_address: standardized,
              parcel: {
                weight: parseFloat(item.weight) || 1,
                length: parseFloat(item.length) || 1,
                width: parseFloat(item.width) || 1,
                height: parseFloat(item.height) || 1,
                // Remove declared_value as it doesn't exist in ParcelDetails
              }
            };

            return {
              id: `shipment-${Date.now()}-${index}`,
              customer_name: item.customer_name || item.recipient,
              customer_address: `${standardized.street1}, ${standardized.city}, ${standardized.state} ${standardized.zip}`,
              recipient: item.customer_name || item.recipient,
              email: item.customer_email,
              phone: item.customer_phone,
              status: 'pending' as const,
              details: shipmentDetails
            } as BulkShipment;
          } catch (addressError) {
            console.error("Address standardization error:", addressError);
            toast.error(`Address standardization failed for shipment ${index + 1}`);
            return null;
          }
        })
      );

      // Filter out any null shipments (failed address standardization)
      const validShipments = shipments.filter(shipment => shipment !== null) as BulkShipment[];

      // Process all shipments to get rates
      const uploadResults = await processBulkShipping(validShipments, pickupAddress);

      if (uploadResults) {
        setResults(uploadResults);
        setUploadStatus('editing');
        toast.success(`Successfully processed ${uploadResults.successful} shipments`);
      } else {
        setUploadStatus('error');
        toast.error("Failed to process shipments");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus('error');
      toast.error("File upload failed. Please check the file format.");
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  const processBulkShipping = async (shipments: BulkShipment[], pickup: SavedAddress | null): Promise<BulkUploadResult | null> => {
    if (!pickup) {
      toast.error("Please select a pickup address before processing shipments.");
      return null;
    }

    setIsFetchingRates(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-bulk-shipping', {
        body: {
          shipments: shipments.map(s => ({
            id: s.id,
            customer_name: s.customer_name || s.recipient,
            customer_address: s.customer_address,
            details: s.details
          })),
          pickupAddress: pickup
        }
      });

      if (error) throw error;

      if (data?.processedShipments) {
        const totalCost = data.processedShipments.reduce((sum: number, shipment: any) => {
          const selectedRate = shipment.availableRates?.find((rate: any) => rate.id === shipment.selectedRateId);
          return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
        }, 0);

        const uploadResults: BulkUploadResult = {
          total: shipments.length,
          successful: data.processedShipments.length,
          failed: shipments.length - data.processedShipments.length,
          processedShipments: data.processedShipments,
          totalCost: totalCost
        };

        return uploadResults;
      } else {
        toast.error("No shipments processed.");
        return null;
      }
    } catch (error) {
      console.error("Bulk shipping error:", error);
      toast.error("Failed to process bulk shipping. Please try again.");
      return null;
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        return { ...shipment, selectedRateId: rateId, rate: parseFloat(selectedRate?.rate?.toString() || '0') };
      }
      return shipment;
    });

    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);

    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalCost
    });

    toast.success('Rate selected for shipment');
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed from list');
  };

  const handleEditShipment = async (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) return;
    
    try {
      // Update the shipment
      const updatedShipments = results.processedShipments.map(s => 
        s.id === shipmentId ? { ...s, ...updates } : s
      );
      
      setResults({
        ...results,
        processedShipments: updatedShipments
      });
      
      // Refresh rates for the entire batch with updated pickup address
      if (pickupAddress) {
        await handleRefreshAllRates(updatedShipments, pickupAddress);
      }
      
      toast.success('Shipment updated and rates refreshed');
    } catch (error) {
      console.error('Error editing shipment:', error);
      toast.error('Failed to update shipment');
    }
  };

  const handleRefreshAllRates = async (shipments: BulkShipment[], pickup: SavedAddress) => {
    setIsFetchingRates(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-bulk-shipping', {
        body: {
          shipments: shipments.map(s => ({
            id: s.id,
            customer_name: s.customer_name || s.recipient,
            customer_address: s.customer_address,
            details: s.details
          })),
          pickupAddress: pickup,
          refreshRates: true
        }
      });

      if (error) throw error;

      if (data?.processedShipments) {
        const totalCost = data.processedShipments.reduce((sum: number, shipment: any) => {
          const selectedRate = shipment.availableRates?.find((rate: any) => rate.id === shipment.selectedRateId);
          return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
        }, 0);

        setResults({
          ...results!,
          processedShipments: data.processedShipments,
          totalCost
        });
      }
    } catch (error) {
      console.error('Error refreshing batch rates:', error);
      toast.error('Failed to refresh rates for batch');
    } finally {
      setIsFetchingRates(false);
    }
  };

  // Add handleRefreshRates function for individual shipment refreshing
  const handleRefreshRates = async (shipmentId: string) => {
    if (!results || !pickupAddress) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    // For now, refresh all rates since individual refresh requires similar logic
    await handleRefreshAllRates(results.processedShipments, pickupAddress);
  };

  const handleBulkApplyCarrier = (carrierCode: string) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => {
      if (!shipment.availableRates || shipment.availableRates.length === 0) {
        return shipment;
      }

      let bestRate;

      switch (carrierCode) {
        case 'cheapest':
          bestRate = shipment.availableRates.reduce((min, rate) => parseFloat(rate.rate.toString()) < parseFloat(min.rate.toString()) ? rate : min);
          break;
        case 'fastest':
          bestRate = shipment.availableRates.reduce((fastest, rate) => (rate.delivery_days || 99) < (fastest.delivery_days || 99) ? rate : fastest);
          break;
        case 'balanced':
          bestRate = shipment.availableRates.reduce((best, rate) => {
            const rateScore = 1 / parseFloat(rate.rate.toString()) + 1 / (rate.delivery_days || 5);
            const bestScore = 1 / parseFloat(best.rate.toString()) + 1 / (best.delivery_days || 5);
            return rateScore > bestScore ? rate : best;
          });
          break;
        default:
          bestRate = shipment.availableRates[0];
      }

      if (bestRate) {
        return { ...shipment, selectedRateId: bestRate.id, rate: parseFloat(bestRate.rate.toString()) };
      }

      return shipment;
    });

    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);

    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalCost
    });

    toast.success(`Applied ${carrierCode} to all shipments`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      "customer_name,customer_address,customer_city,customer_state,customer_zip,customer_email,customer_phone,weight,length,width,height,declared_value,insurance_enabled",
      "John Doe,123 Main St,Anytown,CA,91234,john.doe@example.com,555-123-4567,1.0,6,4,2,100,true",
      "Jane Smith,456 Elm St,Springfield,IL,62704,jane.smith@example.com,555-987-6543,2.5,8,6,4,250,false"
    ].join('\n');

    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_shipping_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Downloaded CSV template');
  };

  const handleDownloadAllLabels = () => {
    toast.success('Download all labels functionality will be implemented soon');
  };

  const handleDownloadLabelsWithFormat = (format: string) => {
    toast.success(`Download labels with ${format} format functionality will be implemented soon`);
  };

  const handleDownloadSingleLabel = (labelUrl: string, format: string = 'png') => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  };

  const handleEmailLabels = (email: string) => {
    toast.success('Email functionality will be implemented soon');
  };

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: results.processedShipments,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6',
            generateBatch: true
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      if (data.processedLabels && data.processedLabels.length > 0) {
        setResults({
          ...results,
          processedShipments: data.processedLabels,
          batchResult: data.batchResult,
          bulk_label_pdf_url: data.batchResult?.consolidatedLabelUrls?.pdf,
          bulk_label_png_url: data.batchResult?.consolidatedLabelUrls?.png,
        });

        setUploadStatus('success');
        toast.success(`Successfully created ${data.successful} shipping labels`);

        if (data.failedLabels && data.failedLabels.length > 0) {
          console.error('Failed labels:', data.failedLabels);
          toast.error(`${data.failedLabels.length} labels failed to create. Check console for details.`);
        }
      } else {
        throw new Error(data.message || 'No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const filteredShipments = results?.processedShipments?.filter(shipment => {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Safe address string construction
    let addressStr = '';
    if (shipment.customer_address) {
      if (typeof shipment.customer_address === 'string') {
        addressStr = shipment.customer_address;
      } else if (typeof shipment.customer_address === 'object') {
        const addr = shipment.customer_address as any;
        addressStr = `${addr.street1 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zip || ''}`;
      }
    }
    
    const matchesSearch =
      shipment.customer_name?.toLowerCase().includes(searchTermLower) ||
      addressStr.toLowerCase().includes(searchTermLower);

    const matchesCarrier = selectedCarrierFilter === 'all' || shipment.availableRates?.some(rate => rate.carrier.toLowerCase().includes(selectedCarrierFilter));

    return matchesSearch && matchesCarrier;
  }).sort((a, b) => {
    const aValue = a[sortField as keyof BulkShipment];
    const bValue = b[sortField as keyof BulkShipment];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      return 0;
    }
  });

  return {
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
    handleUpload,
    processBulkShipping,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshAllRates,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleDownloadTemplate,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleCreateLabels,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  };
};
