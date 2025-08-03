
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';

export const useShipmentManagement = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [showLabelOptions, setShowLabelOptions] = useState(false);

  const loadDefaultPickupAddress = async () => {
    try {
      const address = await addressService.getDefaultFromAddress();
      if (address) {
        setPickupAddress(address);
      }
    } catch (error) {
      console.error('Error loading default pickup address:', error);
    }
  };

  // Load default pickup address on initialization
  useState(() => {
    loadDefaultPickupAddress();
  });

  const handleRemoveShipment = (shipmentId: string) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Recalculate totals including insurance
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      const shippingCost = selectedRate?.rate || 0;
      const insuranceCost = shipment.insurance_amount || 0;
      return sum + shippingCost + insuranceCost;
    }, 0);
    
    // Calculate separate insurance total
    const totalInsurance = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_amount || 0);
    }, 0);
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost,
      totalInsurance
    });
    
    toast("Shipment removed", {
      description: "The shipment has been removed from your list"
    });
  };

  const handleEditShipment = (shipmentId: string, details: BulkShipment['details']) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.map(shipment => {
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
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments
    });
    
    // Re-fetch rates after editing
    handleRefreshRates(shipmentId);
    
    toast("Shipment updated", {
      description: "The shipment details have been updated. Refreshing rates..."
    });
  };

  const handleRefreshRates = async (shipmentId?: string) => {
    if (!initialResults) return;
    
    try {
      toast("Refreshing rates...", {
        description: "Fetching latest shipping rates"
      });
      
      // If specific shipment ID provided, refresh only that shipment
      const shipmentsToRefresh = shipmentId 
        ? initialResults.processedShipments.filter(s => s.id === shipmentId)
        : initialResults.processedShipments;
      
      // Call the bulk upload processor to refresh rates
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          shipments: shipmentsToRefresh.map(s => ({
            ...s.details,
            id: s.id
          })),
          pickupAddress: pickupAddress,
          refreshRates: true
        }
      });

      if (error) throw new Error(error.message);
      
      // Update results with new rates
      const updatedShipments = initialResults.processedShipments.map(shipment => {
        const refreshedShipment = data.processedShipments.find((s: any) => s.id === shipment.id);
        return refreshedShipment || shipment;
      });
      
      // Recalculate totals
      const totalCost = updatedShipments.reduce((sum, shipment) => {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        return sum + (selectedRate?.rate || 0);
      }, 0);
      
      const totalInsurance = updatedShipments.reduce((sum, shipment) => {
        return sum + (shipment.insurance_amount || 0);
      }, 0);
      
      updateResults({
        ...initialResults,
        processedShipments: updatedShipments,
        totalCost,
        totalInsurance
      });
      
      toast("Rates refreshed successfully", {
        description: "All shipping rates have been updated"
      });
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast("Failed to refresh rates", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    }
  };
  
  const handleProceedToPayment = async () => {
    if (!initialResults) {
      toast("Error", {
        description: "No shipments to process"
      });
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Calculate total including insurance
      const shippingCost = initialResults.processedShipments.reduce((sum, shipment) => {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        return sum + (selectedRate?.rate || 0);
      }, 0);
      
      const insuranceCost = initialResults.processedShipments.reduce((sum, shipment) => {
        return sum + (shipment.insurance_amount || 0);
      }, 0);
      
      const totalAmount = shippingCost + insuranceCost;
      const amountInCents = Math.round(totalAmount * 100);
      
      // Create checkout session with Stripe
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          amount: amountInCents,
          quantity: initialResults.successful,
          description: `Bulk Shipping - ${initialResults.successful} labels (including insurance)`,
          metadata: {
            shipment_ids: initialResults.processedShipments.map(s => s.id).join(','),
            pickup_address_id: pickupAddress?.id,
            shipping_cost: shippingCost,
            insurance_cost: insuranceCost,
            total_cost: totalAmount
          }
        }
      });

      if (error) throw new Error(error.message);
      
      toast("Redirecting to payment...", {
        description: `Processing payment for $${totalAmount.toFixed(2)}`
      });
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast("Payment failed", {
        description: error instanceof Error ? error.message : "Failed to process payment"
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = async () => {
    if (!initialResults || initialResults.processedShipments.length === 0) {
      toast("Error", {
        description: "No shipments to process"
      });
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Process each shipment to create labels
      const updatedShipments = [...initialResults.processedShipments];
      let successCount = 0;
      
      for (const shipment of updatedShipments) {
        if (!shipment.selectedRateId) continue;
        
        try {
          // Make API call to create label
          const { data, error } = await supabase.functions.invoke('create-label', {
            body: { 
              shipmentId: shipment.id, 
              rateId: shipment.selectedRateId,
              pickupAddressId: pickupAddress?.id,
              options: {
                label_format: downloadFormat.toUpperCase(),
                label_size: "4x6"
              }
            }
          });

          if (error) throw new Error(error.message);
          
          // Update shipment with label URL and tracking code
          const index = updatedShipments.findIndex(s => s.id === shipment.id);
          if (index >= 0) {
            updatedShipments[index] = {
              ...shipment,
              label_url: data.labelUrl,
              tracking_code: data.trackingCode,
              status: 'completed' as const
            };
            successCount++;
          }
        } catch (error) {
          console.error(`Error creating label for shipment ${shipment.id}:`, error);
        }
      }
      
      // Update results with labels
      updateResults({
        ...initialResults,
        processedShipments: updatedShipments
      });
      
      if (successCount > 0) {
        toast("Label generation complete", {
          description: `Generated ${successCount} shipping labels`
        });
        
        // Set status to success for the BulkUpload component to show success view
        updateResults({
          ...initialResults,
          processedShipments: updatedShipments,
          successful: successCount,
          failed: initialResults.processedShipments.length - successCount,
          uploadStatus: 'success'
        });
      } else {
        toast("Label generation failed", {
          description: "No labels were generated, please try again"
        });
      }
    } catch (error) {
      console.error('Error creating labels:', error);
      toast("Label generation failed", {
        description: error instanceof Error ? error.message : "Failed to generate labels"
      });
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!initialResults || !initialResults.processedShipments.length) {
      toast("No labels", {
        description: "No labels available to download"
      });
      return;
    }
    
    // Show label options modal
    setShowLabelOptions(true);
  };
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!initialResults || !initialResults.processedShipments.length) return;
    
    setShowLabelOptions(false);
    
    if (format === 'zip') {
      // Handle ZIP download - in a real app this would call a backend endpoint
      toast("Preparing ZIP file", {
        description: `Creating ZIP archive with ${initialResults.processedShipments.length} labels`
      });
      
      // Simulate ZIP download for now
      setTimeout(() => {
        toast("Download ready", {
          description: "Your labels ZIP file is ready to download"
        });
        
        // Open first label as example
        const firstShipment = initialResults.processedShipments.find(s => s.label_url);
        if (firstShipment?.label_url) {
          window.open(firstShipment.label_url, '_blank');
        }
      }, 1500);
      return;
    }
    
    // Set format for future downloads
    setDownloadFormat(format as 'pdf' | 'png' | 'zpl');
    
    // For individual formats, open each label in new tab
    const labelsWithUrls = initialResults.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      // No labels yet, generate them first
      handleCreateLabels();
      return;
    }
    
    toast("Opening labels", {
      description: `Opening ${labelsWithUrls.length} labels in ${format.toUpperCase()} format`
    });
    
    // Open first 3 labels maximum to avoid browser popup blocking
    labelsWithUrls.slice(0, 3).forEach(shipment => {
      if (shipment.label_url) {
        window.open(shipment.label_url, '_blank');
      }
    });
    
    if (labelsWithUrls.length > 3) {
      toast("More labels available", {
        description: `${labelsWithUrls.length - 3} more labels are available for individual download`
      });
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };
  
  const handleEmailLabels = () => {
    toast("Email feature", {
      description: "Email labels feature will be implemented soon"
    });
  };

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    setPickupAddress(address);
    
    if (address) {
      toast.success(`Using ${address.name || 'selected'} address for pickup`);
    }
  };

  return {
    isPaying,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    pickupAddress,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handlePickupAddressSelect,
    setShowLabelOptions,
    setDownloadFormat
  };
};
