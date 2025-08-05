import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';

export type SortField = 'recipient' | 'rate' | 'carrier' | 'customer_address' | 'status';
export type SortDirection = 'asc' | 'desc';
export type UploadStatus = 'idle' | 'uploading' | 'editing' | 'rates_fetching' | 'rate_selection' | 'paying' | 'creating-labels' | 'success' | 'error';

export const useBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('recipient');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string>('all');

  // Use pickup addresses hook
  const { selectedAddress: pickupAddress, setSelectedAddress: setPickupAddress } = usePickupAddresses();

  const handleUpload = useCallback(async (uploadFile: File) => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!pickupAddress) {
      toast.error('Please select a pickup address in settings');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setProgress(0);

    try {
      const csvContent = await uploadFile.text();
      console.log('CSV content length:', csvContent.length);

      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Failed to process upload');
      }

      console.log('Upload successful:', data);
      
      // Mark international shipments
      if (data.processedShipments) {
        data.processedShipments = data.processedShipments.map((shipment: BulkShipment) => ({
          ...shipment,
          is_international: shipment.details?.to_address?.country !== 'US'
        }));
      }
      
      setResults(data);
      setUploadStatus('editing');
      setProgress(100);
      
      toast.success(`Successfully processed ${data.successful} shipments!`);
      
    } catch (error) {
      console.error('Error during upload:', error);
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [pickupAddress]);

  const handleEditShipment = useCallback((shipment: BulkShipment) => {
    if (!results) return;
    
    setResults(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        processedShipments: prev.processedShipments.map(s => 
          s.id === shipment.id ? { ...shipment } : s
        )
      };
    });
    
    toast.success('Shipment updated successfully');
  }, [results]);

  const handleCreateLabels = useCallback(async () => {
    if (!results?.processedShipments || !pickupAddress) {
      toast.error('No shipments available for label creation');
      return;
    }

    setIsCreatingLabels(true);
    setUploadStatus('creating-labels');

    try {
      // Prepare shipments with customs data for international ones
      const shipmentsToProcess = results.processedShipments.map(shipment => ({
        ...shipment,
        // Include customs_info if it exists
        details: {
          ...shipment.details,
          customs_info: shipment.customs_info
        }
      }));

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: shipmentsToProcess,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        console.error('Label creation error:', error);
        throw new Error(error.message || 'Failed to create labels');
      }

      console.log('Labels created successfully:', data);
      
      setResults(prev => prev ? {
        ...prev,
        ...data,
        processedShipments: data.processedShipments || prev.processedShipments
      } : data);
      
      setUploadStatus('success');
      toast.success('All labels created successfully!');
      
    } catch (error) {
      console.error('Error creating labels:', error);
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  }, [results, pickupAddress]);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    if (!results) return;
    
    setResults(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        processedShipments: prev.processedShipments.map(shipment => {
          if (shipment.id === shipmentId) {
            const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
            if (selectedRate) {
              return {
                ...shipment,
                selectedRateId: rateId,
                rate: parseFloat(selectedRate.rate.toString()),
                carrier: selectedRate.carrier,
                service: selectedRate.service,
                status: 'rate_selected' as const
              };
            }
          }
          return shipment;
        }),
        totalCost: prev.processedShipments.reduce((total, shipment) => {
          if (shipment.id === shipmentId) {
            const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
            return total + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
          }
          return total + (shipment.rate || 0);
        }, 0)
      };
    });
  }, [results]);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    if (!results) return;
    
    setResults(prev => {
      if (!prev) return prev;
      
      const updatedShipments = prev.processedShipments.filter(s => s.id !== shipmentId);
      const totalCost = updatedShipments.reduce((sum, shipment) => sum + (shipment.rate || 0), 0);
      
      return {
        ...prev,
        processedShipments: updatedShipments,
        successful: updatedShipments.length,
        total: updatedShipments.length + (prev.failed || 0),
        totalCost
      };
    });
    
    toast.success('Shipment removed');
  }, [results]);

  const handleRefreshRates = useCallback(async (shipmentId: string) => {
    if (!results || !pickupAddress) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    setIsFetchingRates(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: pickupAddress,
          toAddress: shipment.details.to_address,
          parcel: shipment.details.parcel
        }
      });

      if (error) throw new Error(error.message);

      setResults(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          processedShipments: prev.processedShipments.map(s => 
            s.id === shipmentId ? { ...s, availableRates: data.rates } : s
          )
        };
      });
      
      toast.success('Rates refreshed successfully');
      
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, pickupAddress]);

  const handleBulkApplyCarrier = useCallback((optimization: string) => {
    if (!results) return;
    
    let updatedTotalCost = 0;
    
    setResults(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        processedShipments: prev.processedShipments.map(shipment => {
          if (!shipment.availableRates || shipment.availableRates.length === 0) {
            return shipment;
          }
          
          let selectedRate = null;
          
          switch (optimization) {
            case 'cheapest':
              selectedRate = shipment.availableRates.reduce((min, rate) => 
                parseFloat(rate.rate.toString()) < parseFloat(min.rate.toString()) ? rate : min
              );
              break;
            case 'fastest':
              selectedRate = shipment.availableRates.reduce((fastest, rate) => 
                (rate.delivery_days || 99) < (fastest.delivery_days || 99) ? rate : fastest
              );
              break;
            case 'balanced':
              selectedRate = shipment.availableRates.reduce((best, rate) => {
                const rateScore = 1 / parseFloat(rate.rate.toString()) + 1 / (rate.delivery_days || 5);
                const bestScore = 1 / parseFloat(best.rate.toString()) + 1 / (best.delivery_days || 5);
                return rateScore > bestScore ? rate : best;
              });
              break;
            default:
              selectedRate = shipment.availableRates[0];
          }
          
          if (selectedRate) {
            const rateValue = parseFloat(selectedRate.rate.toString());
            updatedTotalCost += rateValue;
            
            return {
              ...shipment,
              selectedRateId: selectedRate.id,
              rate: rateValue,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
              status: 'rate_selected' as const
            };
          }
          
          return shipment;
        }),
        totalCost: updatedTotalCost
      };
    });
    
    toast.success(`Applied ${optimization} rates to all shipments`);
  }, [results]);

  const handleDownloadAllLabels = useCallback(async () => {
    if (!results?.bulk_label_pdf_url) {
      toast.error('No labels available for download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = results.bulk_label_pdf_url;
      link.download = 'bulk-shipping-labels.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Labels downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download labels');
    }
  }, [results]);

  const handleDownloadLabelsWithFormat = useCallback(async (format: 'pdf' | 'png' | 'zpl') => {
    if (!results?.batchResult?.consolidatedLabelUrls) {
      toast.error('No labels available for download');
      return;
    }

    const urls = results.batchResult.consolidatedLabelUrls;
    let downloadUrl = '';
    
    switch (format) {
      case 'pdf':
        downloadUrl = urls.pdf || '';
        break;
      case 'png':
        downloadUrl = urls.png || '';
        break;
      case 'zpl':
        downloadUrl = urls.zpl || '';
        break;
    }

    if (!downloadUrl) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `bulk-labels.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} labels downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download labels');
    }
  }, [results]);

  const handleDownloadSingleLabel = useCallback(async (shipmentId: string) => {
    if (!results) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipment?.label_url) {
      toast.error('Label not available for this shipment');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = shipment.label_url;
      link.download = `label-${shipment.tracking_code || shipmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Label downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  }, [results]);

  const handleEmailLabels = useCallback(async (email: string, format: 'pdf' | 'png' = 'pdf') => {
    if (!results?.processedShipments) {
      toast.error('No labels available to email');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: {
          email,
          format,
          shipments: results.processedShipments.filter(s => s.label_url)
        }
      });

      if (error) throw new Error(error.message);
      
      toast.success(`Labels emailed to ${email}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to email labels');
    }
  }, [results]);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = `to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference
John Doe,Acme Corp,123 Main St,,Anytown,NY,12345,US,555-1234,john@example.com,1.5,12,8,4,Order-001
Jane Smith,,456 Oak Ave,Apt 2,Other City,CA,67890,US,555-5678,jane@example.com,2.0,10,6,3,Order-002`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk-shipping-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template downloaded successfully');
  }, []);

  // Filter and sort shipments
  const filteredShipments = results?.processedShipments?.filter(shipment => {
    const matchesSearch = searchTerm === '' || 
      shipment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = selectedCarrierFilter === 'all' || 
      shipment.carrier?.toLowerCase() === selectedCarrierFilter.toLowerCase();
    
    return matchesSearch && matchesCarrier;
  })?.sort((a, b) => {
    let aValue = '';
    let bValue = '';
    
    switch (sortField) {
      case 'recipient':
        aValue = a.recipient || a.customer_name || '';
        bValue = b.recipient || b.customer_name || '';
        break;
      case 'rate':
        return sortDirection === 'asc' ? (a.rate || 0) - (b.rate || 0) : (b.rate || 0) - (a.rate || 0);
      case 'carrier':
        aValue = a.carrier || '';
        bValue = b.carrier || '';
        break;
      case 'customer_address':
        aValue = a.customer_address || '';
        bValue = b.customer_address || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
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
    filteredShipments: filteredShipments || [],
    pickupAddress,
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
    setSelectedCarrierFilter
  };
};
