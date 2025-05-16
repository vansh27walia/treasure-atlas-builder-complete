
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { carrierService } from '@/services/CarrierService';

interface LabelResult {
  labelUrl: string;
  trackingCode: string;
  shipmentId: string;
}

export function useShippingLabel() {
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const navigate = useNavigate();

  const createLabel = async (shipmentId: string, rateId: string): Promise<LabelResult | null> => {
    if (!shipmentId || !rateId) {
      toast.error('Missing required information to create label');
      return null;
    }

    setIsCreatingLabel(true);

    try {
      // Create the shipping label
      const result = await carrierService.createLabel(shipmentId, rateId);
      
      toast.success('Shipping label created successfully!');
      return {
        labelUrl: result.labelUrl,
        trackingCode: result.trackingCode,
        shipmentId
      };
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create shipping label');
      return null;
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const navigateToSuccessPage = (labelResult: LabelResult) => {
    // Encode the label URL to pass as a query parameter
    const encodedLabelUrl = encodeURIComponent(labelResult.labelUrl);
    const encodedTrackingCode = encodeURIComponent(labelResult.trackingCode);
    
    // Navigate to success page with label information
    navigate(`/label-success?labelUrl=${encodedLabelUrl}&trackingCode=${encodedTrackingCode}&shipmentId=${labelResult.shipmentId}`);
  };

  return {
    isCreatingLabel,
    createLabel,
    navigateToSuccessPage
  };
}
