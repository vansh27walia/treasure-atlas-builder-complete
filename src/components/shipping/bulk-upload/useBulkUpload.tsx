
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { BulkShipment, BulkUploadResult, CarrierOption, CARRIER_OPTIONS } from '@/types/shipping';

export const useBulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'editing'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'rate' | 'carrier'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV file
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus('idle');
      setResults(null);
      setProgress(0);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setProgress(10); // Start progress

    try {
      // Read the file
      const text = await file.text();
      setProgress(20); // File read
      
      // Validate CSV structure
      const rows = text.split('\n');
      if (rows.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Check CSV headers
      const headers = rows[0].toLowerCase().split(',');
      const requiredFields = ['name', 'street1', 'city', 'state', 'zip', 'country'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`CSV is missing required fields: ${missingFields.join(', ')}`);
      }
      
      setProgress(30); // File validated

      // Process file and generate labels via the API
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: text,
          origin: {
            name: "Shipping Company",
            street1: "123 Main St",
            city: "San Francisco",
            state: "CA",
            zip: "94111",
            country: "US",
            phone: "555-555-5555"
          }
        }
      });

      if (error) throw new Error(error.message);

      setProgress(90); // Processing complete
      
      // Initialize the shipments with empty available rates
      const processedShipments = data.processedShipments.map((shipment: any) => ({
        ...shipment,
        availableRates: [],
        status: shipment.status as 'pending' | 'processing' | 'error' | 'completed'
      }));

      setResults({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        totalCost: data.totalCost,
        processedShipments,
        failedShipments: data.failedShipments || []
      });
      
      setUploadStatus('editing');
      setProgress(100);
      
      toast.success(`Successfully processed ${data.successful} out of ${data.total} shipments. Ready for carrier selection.`);
      
      // Fetch shipping rates for each shipment
      await fetchAllShipmentRates(processedShipments);
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      setUploadStatus('error');
      setProgress(0);
      toast.error(`Failed to process the uploaded file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const fetchAllShipmentRates = async (shipments: BulkShipment[]) => {
    setIsFetchingRates(true);
    
    try {
      const updatedShipments = [...shipments];
      let successCount = 0;
      
      for (let i = 0; i < updatedShipments.length; i++) {
        const shipment = updatedShipments[i];
        
        try {
          // Update status to show we're processing this shipment
          updatedShipments[i] = { ...shipment, status: 'processing' };
          setResults(prev => prev ? {
            ...prev,
            processedShipments: updatedShipments
          } : null);
          
          // Fetch rates for this shipment
          const rates = await fetchShipmentRates(shipment);
          
          // Update shipment with rates
          updatedShipments[i] = { 
            ...shipment, 
            availableRates: rates,
            status: 'completed',
            // Set default selected rate to the cheapest option
            selectedRateId: rates.length > 0 ? rates.sort((a, b) => a.rate - b.rate)[0].id : undefined
          };
          
          successCount++;
        } catch (error) {
          console.error(`Error fetching rates for shipment ${shipment.id}:`, error);
          updatedShipments[i] = { 
            ...shipment, 
            status: 'error',
            error: 'Failed to fetch shipping rates' 
          };
        }
        
        // Update UI with progress
        setResults(prev => prev ? {
          ...prev,
          processedShipments: updatedShipments
        } : null);
      }
      
      toast.success(`Successfully fetched rates for ${successCount} out of ${shipments.length} shipments`);
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      toast.error('Failed to fetch rates for some shipments');
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  const fetchShipmentRates = async (shipment: BulkShipment) => {
    try {
      // Mock function - in a real app, you would call your API to get actual rates
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Generate mock rates for each carrier
      const mockRates = CARRIER_OPTIONS.flatMap(carrier => {
        return carrier.services.map(service => {
          // Base rate between $5-25 with some carrier-specific modifiers
          const baseRate = 5 + Math.random() * 20;
          
          // Add carrier-specific pricing
          let rate = baseRate;
          if (carrier.id === 'fedex') rate *= 1.2; // FedEx is 20% more
          if (carrier.id === 'ups') rate *= 1.1; // UPS is 10% more
          if (carrier.id === 'dhl') rate *= 1.3; // DHL is 30% more
          
          // Service-specific adjustments
          if (service.name.includes('Express') || service.name.includes('Overnight')) {
            rate *= 1.5; // Express services cost 50% more
          }
          
          // Weight and dimensions based adjustments
          const weight = shipment.details.parcel_weight || 5;
          rate += weight * 0.5; // Add $0.50 per pound
          
          return {
            id: `${carrier.id}_${service.id}_${shipment.id}`,
            carrier: carrier.name,
            service: service.name,
            rate: parseFloat(rate.toFixed(2)),
            delivery_days: service.name.includes('Next Day') || service.name.includes('Overnight') 
              ? 1 
              : service.name.includes('2Day') || service.name.includes('2nd Day') 
                ? 2 
                : service.name.includes('3-Day') 
                  ? 3 
                  : Math.floor(3 + Math.random() * 5) // 3-7 days for standard services
          };
        });
      });
      
      return mockRates;
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      throw new Error('Failed to fetch shipping rates');
    }
  };
  
  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        // Find the selected rate
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        
        return { 
          ...shipment, 
          selectedRateId: rateId,
          carrier: selectedRate?.carrier || shipment.carrier,
          service: selectedRate?.service || shipment.service,
          rate: selectedRate?.rate || shipment.rate
        };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost
    });
  };
  
  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Recalculate totals
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed');
  };

  const handleEditShipment = (shipmentId: string, details: BulkShipment['details']) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        return { 
          ...shipment, 
          details: {
            ...shipment.details,
            ...details
          }
        };
      }
      return shipment;
    });
    
    setResults({
      ...results,
      processedShipments: updatedShipments
    });
    
    toast.success('Shipment updated');
  };
  
  const handleRefreshRates = async (shipmentId: string) => {
    if (!results) return;
    
    // Find the shipment
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    // Update shipment status to processing
    const updatedShipments = results.processedShipments.map(s => 
      s.id === shipmentId ? { ...s, status: 'processing' } : s
    );
    
    setResults({
      ...results,
      processedShipments: updatedShipments
    });
    
    try {
      // Fetch new rates
      const rates = await fetchShipmentRates(shipment);
      
      // Update shipment with new rates
      const finalShipments = updatedShipments.map(s => 
        s.id === shipmentId ? { 
          ...s, 
          availableRates: rates,
          status: 'completed',
          selectedRateId: rates.length > 0 ? rates[0].id : s.selectedRateId
        } : s
      );
      
      setResults({
        ...results,
        processedShipments: finalShipments
      });
      
      toast.success('Rates updated successfully');
    } catch (error) {
      // Update shipment with error
      const errorShipments = updatedShipments.map(s => 
        s.id === shipmentId ? { 
          ...s, 
          status: 'error',
          error: 'Failed to refresh rates'
        } : s
      );
      
      setResults({
        ...results,
        processedShipments: errorShipments
      });
      
      toast.error('Failed to update rates');
    }
  };
  
  const handleBulkApplyCarrier = (carrierId: string, serviceId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      // Find a rate that matches the selected carrier and service
      const matchingRate = shipment.availableRates?.find(
        rate => rate.carrier === carrierId && rate.service === serviceId
      );
      
      if (matchingRate) {
        return { 
          ...shipment, 
          selectedRateId: matchingRate.id,
          carrier: matchingRate.carrier,
          service: matchingRate.service,
          rate: matchingRate.rate
        };
      }
      
      // If no matching rate, keep the current selection
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost
    });
    
    toast.success(`Applied ${carrierId} ${serviceId} to all eligible shipments`);
  };

  const handleProceedToPayment = async () => {
    if (!results) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Calculate total amount in cents for Stripe
      const amountInCents = Math.round(results.totalCost * 100);
      
      // Create checkout session with Stripe
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          amount: amountInCents,
          quantity: results.successful,
          description: `Bulk Shipping - ${results.successful} labels`,
          metadata: {
            shipment_ids: results.processedShipments.map(s => s.id).join(',')
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = () => {
    if (!results) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    // Labels are already generated, just simulate completion
    setTimeout(() => {
      setIsCreatingLabels(false);
      toast.success(`${results.successful} shipping labels have been generated`);
      navigate('/dashboard?tab=tracking');
    }, 1000);
  };

  const handleDownloadAllLabels = () => {
    if (!results || !results.processedShipments.length) {
      toast.error('No labels available to download');
      return;
    }
    
    // In a real app, this would download a ZIP file with all labels
    // For this demo, we'll open the first label URL as an example
    toast.success(`Preparing ${results.successful} labels for download`);
    const firstShipment = results.processedShipments[0];
    const labelUrl = firstShipment.label_url || '';
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };

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
    
    toast.success('Template downloaded successfully');
  };
  
  // Filter and sort shipments
  const getFilteredAndSortedShipments = () => {
    if (!results) return [];
    
    return results.processedShipments
      .filter(shipment => {
        // Filter by search term
        const searchFields = [
          shipment.recipient,
          shipment.details.name,
          shipment.details.company || '',
          shipment.details.street1,
          shipment.details.city,
          shipment.details.state,
          shipment.details.zip,
          shipment.carrier,
          shipment.service
        ].join(' ').toLowerCase();
        
        const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
        
        // Filter by carrier
        const matchesCarrier = !selectedCarrierFilter || 
          (shipment.availableRates?.some(rate => 
            rate.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase()
          ));
          
        return matchesSearch && matchesCarrier;
      })
      .sort((a, b) => {
        if (sortField === 'recipient') {
          return sortDirection === 'asc' 
            ? a.recipient.localeCompare(b.recipient)
            : b.recipient.localeCompare(a.recipient);
        }
        
        if (sortField === 'carrier') {
          return sortDirection === 'asc' 
            ? a.carrier.localeCompare(b.carrier)
            : b.carrier.localeCompare(a.carrier);
        }
        
        // Sort by rate
        const rateA = a.availableRates?.find(rate => rate.id === a.selectedRateId)?.rate || 0;
        const rateB = b.availableRates?.find(rate => rate.id === b.selectedRateId)?.rate || 0;
        
        return sortDirection === 'asc' ? rateA - rateB : rateB - rateA;
      });
  };

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
    filteredShipments: getFilteredAndSortedShipments(),
    handleFileChange,
    handleUpload,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadSingleLabel,
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
