
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Package, Calculator } from 'lucide-react';
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
      setShowLoadDetails(Boolean(originComplete && destinationComplete));
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
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Route</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            showLoadDetails ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <span className={`ml-2 text-sm font-medium ${
            showLoadDetails ? 'text-gray-900' : 'text-gray-500'
          }`}>Cargo Details</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            rates.length > 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
          <span className={`ml-2 text-sm font-medium ${
            rates.length > 0 ? 'text-gray-900' : 'text-gray-500'
          }`}>Get Quotes</span>
        </div>
      </div>

      {/* Origin & Destination */}
      <OriginDestinationForm
        originData={formData.origin}
        destinationData={formData.destination}
        onOriginChange={(data) => updateFormData('origin', data)}
        onDestinationChange={(data) => updateFormData('destination', data)}
      />

      {showLoadDetails && (
        <>
          <div className="flex items-center justify-center">
            <div className="border-t border-gray-200 flex-1"></div>
            <div className="mx-6 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Step 2: Tell us about your cargo
            </div>
            <div className="border-t border-gray-200 flex-1"></div>
          </div>
          
          {/* Load Details */}
          <LoadDetailsForm
            loadData={formData.loadDetails}
            onLoadChange={(data) => updateFormData('loadDetails', data)}
          />

          <div className="flex items-center justify-center">
            <div className="border-t border-gray-200 flex-1"></div>
            <div className="mx-6 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Ready to get quotes?
            </div>
            <div className="border-t border-gray-200 flex-1"></div>
          </div>

          {/* Get Quotes Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGetQuotes}
              disabled={!isFormComplete() || isLoading}
              size="lg"
              className="min-w-64 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Getting Your Quotes...
                </div>
              ) : (
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 mr-3" />
                  Get Freight Quotes
                </div>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Results */}
      {rates.length > 0 && (
        <>
          <div className="flex items-center justify-center">
            <div className="border-t border-gray-200 flex-1"></div>
            <div className="mx-6 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Your freight quotes are ready!
            </div>
            <div className="border-t border-gray-200 flex-1"></div>
          </div>
          <FreightRatesDisplay rates={rates} onBooking={(rate) => console.log('Booking:', rate)} />
        </>
      )}
    </div>
  );
};

export default FreightForwardingForm;
