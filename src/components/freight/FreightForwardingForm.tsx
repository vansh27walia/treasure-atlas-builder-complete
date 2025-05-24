
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OriginDestinationForm from './OriginDestinationForm';
import LoadDetailsForm from './LoadDetailsForm';
import FreightRatesDisplay from './FreightRatesDisplay';
import { FreightFormData, FreightRate } from '@/types/freight';

const FreightForwardingForm: React.FC = () => {
  const [formData, setFormData] = useState<FreightFormData>({
    origin: {
      locationType: '',
      country: '',
      address: ''
    },
    destination: {
      locationType: '',
      country: '',
      address: ''
    },
    loadDetails: {
      type: 'loose-cargo',
      loads: []
    }
  });

  const [rates, setRates] = useState<FreightRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadDetails, setShowLoadDetails] = useState(false);

  const updateFormData = (section: keyof FreightFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));

    // Show load details when both origin and destination are complete
    if (section === 'origin' || section === 'destination') {
      const updatedData = { ...formData, [section]: data };
      const originComplete = updatedData.origin.locationType && updatedData.origin.country && updatedData.origin.address;
      const destinationComplete = updatedData.destination.locationType && updatedData.destination.country && updatedData.destination.address;
      setShowLoadDetails(originComplete && destinationComplete);
    }
  };

  const isFormComplete = () => {
    const { origin, destination, loadDetails } = formData;
    return origin.locationType && origin.country && origin.address &&
           destination.locationType && destination.country && destination.address &&
           loadDetails.loads.length > 0;
  };

  const handleGetQuotes = async () => {
    if (!isFormComplete()) return;

    setIsLoading(true);
    try {
      // Call backend API for freight rates
      const response = await fetch('/api/freight-forwarding/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const ratesData = await response.json();
        setRates(ratesData.rates || []);
      } else {
        console.error('Failed to fetch freight rates');
      }
    } catch (error) {
      console.error('Error fetching freight rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Origin & Destination */}
      <OriginDestinationForm
        originData={formData.origin}
        destinationData={formData.destination}
        onOriginChange={(data) => updateFormData('origin', data)}
        onDestinationChange={(data) => updateFormData('destination', data)}
      />

      {showLoadDetails && (
        <>
          <Separator />
          
          {/* Load Details */}
          <LoadDetailsForm
            loadData={formData.loadDetails}
            onLoadChange={(data) => updateFormData('loadDetails', data)}
          />

          <Separator />

          {/* Get Quotes Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGetQuotes}
              disabled={!isFormComplete() || isLoading}
              size="lg"
              className="min-w-48"
            >
              {isLoading ? 'Getting Quotes...' : 'Get Freight Quotes'}
            </Button>
          </div>
        </>
      )}

      {/* Results */}
      {rates.length > 0 && (
        <>
          <Separator />
          <FreightRatesDisplay rates={rates} onBooking={(rate) => console.log('Booking:', rate)} />
        </>
      )}
    </div>
  );
};

export default FreightForwardingForm;
