
import React from 'react';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import OrderSummary from './bulk-upload/OrderSummary';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { useToast } from "@/components/ui/use-toast"
import { SavedAddress } from '@/services/AddressService';

const BulkUpload: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState<'upload' | 'review' | 'payment'>('upload');
  const [uploadResult, setUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [pickupAddress, setPickupAddress] = React.useState<SavedAddress | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [isPaying, setIsPaying] = React.useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = React.useState(false);
  const { toast } = useToast()

  const handleUploadSuccess = (results: any) => {
    setUploadResult(results);
    setCurrentStep('review');
    toast({
      title: "Upload Complete",
      description: "Your file has been successfully uploaded and processed.",
    })
  };

  const handleUploadFail = (error: string) => {
    toast({
      variant: "destructive",
      title: "Upload Failed",
      description: error,
    })
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);

      // Call the Supabase function to process the bulk upload
      const response = await fetch('/functions/process-bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: await file.text(), pickupAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadResult(data);
      setCurrentStep('review');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      })
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleSelectRate = (shipmentId: string, rateId: string) => {
    setUploadResult((prevResult) => {
      if (!prevResult || !prevResult.processedShipments) return prevResult;

      const updatedShipments = prevResult.processedShipments.map(shipment => {
        if (shipment.id === shipmentId) {
          return { ...shipment, selectedRateId: rateId };
        }
        return shipment;
      });

      return { ...prevResult, processedShipments: updatedShipments };
    });
  };

  const handleRemoveShipment = (shipmentId: string) => {
    setUploadResult((prevResult) => {
      if (!prevResult || !prevResult.processedShipments) return prevResult;

      const updatedShipments = prevResult.processedShipments.filter(shipment => shipment.id !== shipmentId);
      return { ...prevResult, processedShipments: updatedShipments };
    });
  };

  const handleRefreshRates = (shipmentId: string) => {
    // Implementation for refreshing rates
    console.log('Refreshing rates for shipment:', shipmentId);
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
  };

  const handleEditShipment = (shipment: BulkShipment) => {
    // Implementation for editing shipment
    console.log('Editing shipment:', shipment);
  };

  const handleDownloadAllLabels = () => {
    setIsCreatingLabels(true);
    // Implementation for downloading labels
    setTimeout(() => {
      setIsCreatingLabels(false);
    }, 3000);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!uploadResult?.processedShipments) return { totalCost: 0, totalInsurance: 0, successfulCount: 0 };

    const shipmentsWithRates = uploadResult.processedShipments.filter(s => s.selectedRateId && s.availableRates);
    const successfulCount = shipmentsWithRates.length;

    let totalCost = 0;
    let totalInsurance = 0;

    shipmentsWithRates.forEach(shipment => {
      const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
      if (selectedRate) {
        totalCost += parseFloat(selectedRate.rate.toString());
        
        // Calculate insurance (1% of declared value, minimum $1)
        if (shipment.details?.parcel?.predefined_package) {
          const declaredValue = parseFloat(shipment.details.parcel.predefined_package) || 0;
          const insurance = Math.max(declaredValue * 0.01, 1);
          totalInsurance += insurance;
        }
      }
    });

    return { totalCost, totalInsurance, successfulCount };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bulk Shipping</h1>
      </div>

      {currentStep === 'upload' && (
        <BulkUploadForm
          onUploadSuccess={handleUploadSuccess}
          onUploadFail={handleUploadFail}
          onPickupAddressSelect={setPickupAddress}
          isUploading={isUploading}
          progress={progress}
          handleUpload={handleUpload}
        />
      )}

      {currentStep === 'review' && uploadResult && (
        <div className="space-y-6">
          <BulkShipmentsList
            shipments={uploadResult.processedShipments}
            isFetchingRates={false}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipment}
            onRefreshRates={handleRefreshRates}
          />
          
          <OrderSummary
            successfulCount={calculateTotals().successfulCount}
            totalCost={calculateTotals().totalCost}
            totalInsurance={calculateTotals().totalInsurance}
            onDownloadAllLabels={handleDownloadAllLabels}
            onProceedToPayment={handleProceedToPayment}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
          />
        </div>
      )}

      {/* Payment Step (Placeholder) */}
      {currentStep === 'payment' && (
        <div>
          <h2>Payment</h2>
          <p>Implement payment processing here.</p>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
