
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Upload, DollarSign, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkResults from './bulk-upload/BulkResults';
import OrderSummary from './bulk-upload/OrderSummary';
import AdvancedProgressTracker from './bulk-upload/AdvancedProgressTracker';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from '@/services/AddressService';

const BulkUpload: React.FC = () => {
  const [uploadResults, setUploadResults] = useState<BulkUploadResult | null>(null);
  const [shipments, setShipments] = useState<BulkShipment[]>([]);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'payment' | 'labels'>('upload');

  // Calculate totals with proper insurance handling
  const { totalCost, totalInsurance, successfulCount } = useMemo(() => {
    if (!uploadResults?.processedShipments) {
      return { totalCost: 0, totalInsurance: 0, successfulCount: 0 };
    }

    let totalShippingCost = 0;
    let totalInsuranceCost = 0;
    let successful = 0;

    uploadResults.processedShipments.forEach(shipment => {
      if (shipment.status === 'completed' && shipment.selectedRateId) {
        successful++;
        
        // Get the selected rate cost
        const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
        if (selectedRate) {
          totalShippingCost += parseFloat(selectedRate.rate.toString());
        }
        
        // Calculate insurance cost if enabled
        if (shipment.details?.insurance_enabled) {
          const declaredValue = shipment.details.declared_value || 200;
          // Insurance cost is typically 1% of declared value with minimum
          const insuranceCost = Math.max(declaredValue * 0.01, 2.50);
          totalInsuranceCost += insuranceCost;
        }
      }
    });

    return {
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost,
      successfulCount: successful
    };
  }, [uploadResults]);

  const handleUploadSuccess = useCallback((results: BulkUploadResult) => {
    console.log('Upload results received:', results);
    setUploadResults(results);
    setShipments(results.processedShipments || []);
    setCurrentStep('review');
    
    toast.success(`Successfully processed ${results.successful} shipments!`);
  }, []);

  const handleUploadFail = useCallback((error: string) => {
    console.error('Upload failed:', error);
    toast.error(error);
  }, []);

  const handlePickupAddressSelect = useCallback((address: SavedAddress) => {
    setSelectedPickupAddress(address);
  }, []);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    setShipments(prevShipments =>
      prevShipments.map(shipment =>
        shipment.id === shipmentId
          ? { ...shipment, selectedRateId: rateId }
          : shipment
      )
    );

    // Update the results as well
    if (uploadResults?.processedShipments) {
      const updatedResults = {
        ...uploadResults,
        processedShipments: uploadResults.processedShipments.map(shipment =>
          shipment.id === shipmentId
            ? { ...shipment, selectedRateId: rateId }
            : shipment
        )
      };
      setUploadResults(updatedResults);
    }
  }, [uploadResults]);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    setShipments(prevShipments => prevShipments.filter(s => s.id !== shipmentId));
    
    if (uploadResults?.processedShipments) {
      const updatedResults = {
        ...uploadResults,
        processedShipments: uploadResults.processedShipments.filter(s => s.id !== shipmentId),
        successful: uploadResults.processedShipments.filter(s => s.id !== shipmentId && s.status === 'completed').length
      };
      setUploadResults(updatedResults);
    }
  }, [uploadResults]);

  const handleEditShipment = useCallback((shipmentId: string, updates: Partial<BulkShipment>) => {
    console.log('Editing shipment:', shipmentId, updates);
    
    setShipments(prevShipments =>
      prevShipments.map(shipment =>
        shipment.id === shipmentId
          ? { ...shipment, ...updates }
          : shipment
      )
    );

    // Update the results as well
    if (uploadResults?.processedShipments) {
      const updatedResults = {
        ...uploadResults,
        processedShipments: uploadResults.processedShipments.map(shipment =>
          shipment.id === shipmentId
            ? { ...shipment, ...updates }
            : shipment
        )
      };
      setUploadResults(updatedResults);
    }
  }, [uploadResults]);

  const handleProceedToPayment = async () => {
    console.log('Proceeding to payment with costs:', { totalCost, totalInsurance });
    setIsPaying(true);
    setCurrentStep('payment');
    
    try {
      const finalTotal = totalCost + totalInsurance;
      const amountInCents = Math.round(finalTotal * 100);
      
      console.log('Creating bulk checkout session for amount:', amountInCents);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: {
          amount: amountInCents,
          shipments: uploadResults?.processedShipments?.filter(s => s.status === 'completed') || [],
          description: `Bulk shipping labels (${successfulCount} labels)`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setCurrentStep('review');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownloadAllLabels = async () => {
    setIsCreatingLabels(true);
    setCurrentStep('labels');
    
    try {
      const validShipments = uploadResults?.processedShipments?.filter(
        s => s.status === 'completed' && s.selectedRateId
      ) || [];

      if (validShipments.length === 0) {
        toast.error('No valid shipments found for label creation');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: validShipments,
          pickupAddress: selectedPickupAddress
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.labelUrls && data.labelUrls.length > 0) {
        // Download each label
        data.labelUrls.forEach((labelData: any, index: number) => {
          const link = document.createElement('a');
          link.href = labelData.url;
          link.download = `label_${index + 1}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
        
        toast.success(`Successfully created and downloaded ${data.labelUrls.length} labels!`);
      }
    } catch (error) {
      console.error('Label creation error:', error);
      toast.error('Failed to create labels. Please try again.');
      setCurrentStep('review');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleStartOver = () => {
    setUploadResults(null);
    setShipments([]);
    setCurrentStep('upload');
  };

  if (!uploadResults) {
    return (
      <div className="space-y-6">
        <AdvancedProgressTracker 
          uploadStatus="idle"
          isUploading={false}
          isFetchingRates={false}
          isCreatingLabels={false}
          progress={0}
          totalShipments={0}
          processedShipments={0}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BulkUploadForm 
              onUploadSuccess={handleUploadSuccess}
              onUploadFail={handleUploadFail}
              onPickupAddressSelect={handlePickupAddressSelect}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdvancedProgressTracker 
        uploadStatus="editing"
        isUploading={false}
        isFetchingRates={false}
        isCreatingLabels={isCreatingLabels}
        progress={100}
        totalShipments={uploadResults.total}
        processedShipments={uploadResults.successful}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BulkResults
            results={{
              total: uploadResults.total,
              successful: uploadResults.successful,
              failed: uploadResults.failed,
              totalCost: totalCost,
              success: uploadResults.successful > 0,
              message: `Successfully processed ${uploadResults.successful} out of ${uploadResults.total} shipments`,
              processedShipments: uploadResults.processedShipments.map(shipment => ({
                id: shipment.id,
                status: shipment.status === 'completed' ? 'rates_fetched' : 'error',
                shipment_data: shipment.details?.to_address ? {
                  to_name: shipment.details.to_address.name || '',
                  to_city: shipment.details.to_address.city,
                  to_state: shipment.details.to_address.state
                } : undefined,
                rates: shipment.availableRates?.map(rate => ({
                  id: rate.id,
                  carrier: rate.carrier,
                  service: rate.service,
                  rate: rate.rate.toString(),
                  total_cost: rate.rate,
                  delivery_days: rate.delivery_days?.toString() || '0'
                })) || [],
                selected_rate_id: shipment.selectedRateId || '',
                total_cost: shipment.rate || 0,
                error_message: shipment.error || '',
                insurance_amount: shipment.details?.declared_value || 0,
                insurance_cost: shipment.details?.insurance_enabled ? 
                  Math.max((shipment.details.declared_value || 200) * 0.01, 2.50) : 0
              }))
            }}
            onRateChange={handleSelectRate}
          />
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary
            successfulCount={successfulCount}
            totalCost={totalCost}
            totalInsurance={totalInsurance}
            onProceedToPayment={handleProceedToPayment}
            onDownloadAllLabels={handleDownloadAllLabels}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
          />
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
