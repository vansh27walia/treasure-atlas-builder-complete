import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'editing' | 'success' | 'error';
type SortDirection = 'asc' | 'desc';
type SortField = 'address' | 'price' | 'service';

export const useBulkUpload = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  
  // Filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('address');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);
  
  // Progress simulation
  useEffect(() => {
    if (isUploading && progress < 100) {
      const timer = setTimeout(() => {
        setProgress(prev => {
          // Slow down as we get closer to 100%
          const increment = prev < 50 ? 15 : prev < 75 ? 8 : prev < 90 ? 3 : 1;
          return Math.min(prev + increment, 99); // Cap at 99% until actually complete
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isUploading, progress]);
  
  // Reset progress when upload is complete
  useEffect(() => {
    if (uploadStatus !== 'uploading' && uploadStatus !== 'processing') {
      setProgress(0);
    }
  }, [uploadStatus]);
  
  // Filter shipments based on search and carrier filter
  const filteredShipments = results?.processedShipments.filter(shipment => {
    const matchesSearch = searchTerm === '' || 
      shipment.toAddress.street1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toAddress.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toAddress.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toAddress.zip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toAddress.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toAddress.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = selectedCarrierFilter === null || 
      shipment.selectedRate?.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase();
    
    return matchesSearch && matchesCarrier;
  }) || [];
  
  // Sort filtered shipments
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    if (sortField === 'address') {
      const addrA = `${a.toAddress.street1}, ${a.toAddress.city}, ${a.toAddress.state}`;
      const addrB = `${b.toAddress.street1}, ${b.toAddress.city}, ${b.toAddress.state}`;
      return sortDirection === 'asc' 
        ? addrA.localeCompare(addrB)
        : addrB.localeCompare(addrA);
    } else if (sortField === 'price') {
      const priceA = a.selectedRate?.rate || 0;
      const priceB = b.selectedRate?.rate || 0;
      return sortDirection === 'asc' 
        ? priceA - priceB
        : priceB - priceA;
    } else if (sortField === 'service') {
      const serviceA = a.selectedRate?.service || '';
      const serviceB = b.selectedRate?.service || '';
      return sortDirection === 'asc' 
        ? serviceA.localeCompare(serviceB)
        : serviceB.localeCompare(serviceA);
    }
    
    return 0;
  });
  
  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setProgress(0);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          const base64Data = event.target?.result?.toString().split(',')[1];
          
          if (!base64Data) {
            throw new Error('Failed to convert file to base64');
          }
          
          try {
            // Send to Supabase edge function for processing
            const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
              body: { 
                fileName: file.name,
                fileContent: base64Data,
                pickupAddress // Include the pickup address
              }
            });
            
            if (error) {
              throw error;
            }
            
            // Handle successful upload
            setProgress(100);
            setResults(data as BulkUploadResult);
            setUploadStatus('editing');
            setIsUploading(false);
            toast.success('File processed successfully');
            resolve(data);
          } catch (processingError) {
            console.error('Processing error:', processingError);
            setUploadStatus('error');
            setIsUploading(false);
            toast.error('Error processing file: ' + processingError.message);
            reject(processingError);
          }
        };
        
        reader.onerror = (error) => {
          setUploadStatus('error');
          setIsUploading(false);
          toast.error('Error reading file');
          reject(error);
        };
        
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setIsUploading(false);
      toast.error('Upload failed: ' + error.message);
    }
  };
  
  // Handle selecting a shipping rate for a specific shipment
  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.rates.find(rate => rate.id === rateId);
        return { ...shipment, selectedRate };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + (shipment.selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
  };
  
  // Handle removing a shipment
  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Calculate new total cost
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + (shipment.selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
    
    toast.success('Shipment removed');
  };
  
  // Handle editing a shipment
  const handleEditShipment = (shipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(s => {
      return s.id === shipment.id ? shipment : s;
    });
    
    // Calculate new total cost
    const newTotalCost = updatedShipments.reduce((total, s) => {
      return total + (s.selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
    
    toast.success('Shipment updated');
  };
  
  // Handle refreshing rates for a shipment
  const handleRefreshRates = async (shipmentId: string) => {
    if (!results) return;
    
    setIsFetchingRates(true);
    
    try {
      // Find the shipment that needs rates refreshed
      const shipment = results.processedShipments.find(s => s.id === shipmentId);
      
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      
      // Call edge function to get fresh rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { 
          fromAddress: pickupAddress || shipment.fromAddress,
          toAddress: shipment.toAddress,
          parcel: shipment.parcel
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update the shipment with new rates
      const updatedShipment = {
        ...shipment,
        rates: data.rates,
        // Keep the selected rate if it still exists in the new rates
        selectedRate: data.rates.find(r => 
          shipment.selectedRate && r.id === shipment.selectedRate.id
        ) || data.rates[0] // Default to first rate if previous selection not found
      };
      
      // Update shipments array
      const updatedShipments = results.processedShipments.map(s => {
        return s.id === shipmentId ? updatedShipment : s;
      });
      
      // Calculate new total cost
      const newTotalCost = updatedShipments.reduce((total, s) => {
        return total + (s.selectedRate?.rate || 0);
      }, 0);
      
      setResults({
        ...results,
        processedShipments: updatedShipments,
        totalCost: newTotalCost
      });
      
      toast.success('Rates refreshed');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates: ' + error.message);
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  // Apply the same carrier to all shipments
  const handleBulkApplyCarrier = (carrierName: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      // Find the cheapest rate for this carrier
      const carrierRates = shipment.rates.filter(
        rate => rate.carrier.toLowerCase() === carrierName.toLowerCase()
      );
      
      if (carrierRates.length === 0) {
        // No rates for this carrier, keep existing selection
        return shipment;
      }
      
      // Sort by price and pick the cheapest
      const cheapestRate = [...carrierRates].sort((a, b) => a.rate - b.rate)[0];
      
      return {
        ...shipment,
        selectedRate: cheapestRate
      };
    });
    
    // Calculate new total cost
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + (shipment.selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
    
    toast.success(`Applied ${carrierName} to all eligible shipments`);
  };
  
  // Download template CSV file
  const handleDownloadTemplate = () => {
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
  };

  // Proceed to payment
  const handleProceedToPayment = async () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Check if all shipments have selected rates
      const missingRates = results.processedShipments.filter(s => !s.selectedRate);
      
      if (missingRates.length > 0) {
        throw new Error(`${missingRates.length} shipments are missing selected rates`);
      }
      
      // Process payment via Edge Function
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          shipments: results.processedShipments,
          fromAddress: pickupAddress || results.processedShipments[0].fromAddress
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state with result
      setResults(data);
      setUploadStatus('success');
      toast.success('Payment processed successfully');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsPaying(false);
    }
  };
  
  // Generate and download labels
  const handleCreateLabels = async () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Generate labels via Edge Function
      const { data, error } = await supabase.functions.invoke('create-labels', {
        body: { 
          shipments: results.processedShipments,
          fromAddress: pickupAddress || results.processedShipments[0].fromAddress
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state with result
      setResults(data);
      toast.success('Labels generated successfully');
    } catch (error) {
      console.error('Label generation error:', error);
      toast.error('Failed to generate labels: ' + error.message);
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  // Download all labels in default format
  const handleDownloadAllLabels = () => {
    if (!results || !results.processedShipments.some(s => s.labelUrl)) {
      setShowLabelOptions(true);
      return;
    }
    
    // If labels exist, download them
    results.processedShipments.forEach(shipment => {
      if (shipment.labelUrl) {
        window.open(shipment.labelUrl, '_blank');
      }
    });
  };
  
  // Download labels in specific format (called from LabelOptionsModal)
  const handleDownloadLabelsWithFormat = async (format: string) => {
    setIsCreatingLabels(true);
    
    try {
      // Generate labels in specified format
      const { data, error } = await supabase.functions.invoke('create-labels', {
        body: { 
          shipments: results?.processedShipments,
          fromAddress: pickupAddress || results?.processedShipments[0].fromAddress,
          format
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state and download
      setResults(data);
      setShowLabelOptions(false);
      
      if (format === 'zip') {
        // Download as ZIP file
        if (data.batchLabelUrl) {
          window.open(data.batchLabelUrl, '_blank');
        }
      } else {
        // Download individual PDFs/PNGs
        data.processedShipments.forEach(shipment => {
          if (shipment.labelUrl) {
            window.open(shipment.labelUrl, '_blank');
          }
        });
      }
      
      toast.success(`Labels downloaded in ${format.toUpperCase()} format`);
    } catch (error) {
      console.error('Label download error:', error);
      toast.error('Failed to download labels: ' + error.message);
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  // Download a single label
  const handleDownloadSingleLabel = (shipmentId: string) => {
    if (!results) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    
    if (shipment && shipment.labelUrl) {
      window.open(shipment.labelUrl, '_blank');
    } else {
      toast.error('Label not available for this shipment');
    }
  };
  
  // Email labels to customer
  const handleEmailLabels = async (email: string) => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to email');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Send email via Edge Function
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: { 
          shipments: results.processedShipments,
          email
        }
      });
      
      if (error) {
        throw error;
      }
      
      setShowLabelOptions(false);
      toast.success(`Labels emailed to ${email}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to email labels: ' + error.message);
    } finally {
      setIsCreatingLabels(false);
    }
  };

  return {
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    showLabelOptions,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments: sortedShipments,
    pickupAddress,
    setPickupAddress,
    handleUpload,
    handleProceedToPayment,
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
    setShowLabelOptions,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  };
};
