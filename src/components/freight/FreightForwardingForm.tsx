
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Package, Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import SimplifiedOriginDestinationForm from './SimplifiedOriginDestinationForm';
import LoadDetailsForm from './LoadDetailsForm';
import FreightRatesDisplay from './FreightRatesDisplay';
import { FreightLoadDetails } from '@/types/freight';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SimplifiedLocationData {
  portName: string;
  country: string;
}

interface SimplifiedFormData {
  origin: SimplifiedLocationData;
  destination: SimplifiedLocationData;
  loadDetails: FreightLoadDetails;
}

const FreightForwardingForm: React.FC = () => {
  const [formData, setFormData] = useState<SimplifiedFormData>({
    origin: {
      portName: '',
      country: ''
    },
    destination: {
      portName: '',
      country: ''
    },
    loadDetails: {
      type: 'loose-cargo',
      loads: []
    }
  });

  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadDetails, setShowLoadDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestParams, setRequestParams] = useState<any>(null);

  const updateFormData = (section: keyof SimplifiedFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));

    // Show load details when both origin and destination are complete
    if (section === 'origin' || section === 'destination') {
      const updatedData = { ...formData, [section]: data };
      const originComplete = updatedData.origin.portName && updatedData.origin.country;
      const destinationComplete = updatedData.destination.portName && updatedData.destination.country;
      setShowLoadDetails(Boolean(originComplete && destinationComplete));
    }
  };

  const isFormComplete = () => {
    const { origin, destination, loadDetails } = formData;
    return origin.portName && origin.country &&
           destination.portName && destination.country &&
           loadDetails.loads.length > 0;
  };

  const handleGetQuotes = async () => {
    if (!isFormComplete()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRates([]);
    
    try {
      // Transform the form data to match the new API structure
      const transformedPayload = {
        origin: {
          portName: formData.origin.portName
        },
        destination: {
          portName: formData.destination.portName
        },
        loadDetails: {
          loads: formData.loadDetails.loads.map((load: any) => {
            if (formData.loadDetails.type === 'loose-cargo') {
              // Calculate weight and volume for loose cargo
              const weight = load.weight ? (load.weight.unit === 'lbs' ? load.weight.value * 0.453592 : load.weight.value) : 100;
              const volume = load.dimensions ? 
                (load.dimensions.length * load.dimensions.width * load.dimensions.height) / 1000000 * 
                (load.dimensions.unit === 'in' ? Math.pow(2.54, 3) : 1) : 0.05;
              
              return {
                quantity: load.quantity || 1,
                unitType: load.unitType || 'boxes',
                weight: weight,
                totalVolume: volume
              };
            } else {
              // Container loads
              const containerWeight = load.containerSize === '20ft' ? 15000 : 25000;
              const containerVolume = load.containerSize === '20ft' ? 33 : 67;
              
              return {
                quantity: load.quantity || 1,
                unitType: 'containers',
                weight: containerWeight,
                totalVolume: containerVolume
              };
            }
          })
        }
      };

      console.log('Sending transformed payload to Freightos API:', transformedPayload);
      
      const { data, error } = await supabase.functions.invoke('freight-forwarding-rates', {
        body: transformedPayload
      });

      if (error) {
        console.error('Error getting freight rates:', error);
        
        if (error.message?.includes('credentials not configured')) {
          setError('Freightos API credentials are not configured. Please contact support to set up API access for real freight rates.');
          toast.error('API setup required for real freight rates');
        } else if (error.message?.includes('Invalid origin port') || error.message?.includes('Invalid destination port')) {
          setError(error.message);
          toast.error('Please select valid ports from the dropdown');
        } else {
          setError(`Failed to get freight rates: ${error.message || 'Unknown error'}`);
          toast.error('Failed to get freight rates. Please try again.');
        }
        return;
      }

      console.log('Received freight rates from Freightos API:', data);
      
      if (data?.requiresSetup) {
        setError(data.message);
        toast.error('Freightos API setup required');
        return;
      }
      
      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        setRequestParams({
          origin: formData.origin.portName,
          destination: formData.destination.portName,
          routeInfo: data.routeInfo
        });
        setError(null);
        toast.success(`✅ Found ${data.rates.length} freight rate estimate${data.rates.length !== 1 ? 's' : ''} from Freightos API!`);
      } else {
        setError('No freight rates found for this route. Please check your shipment details and try again.');
        toast.warning('No freight rates found for this route');
        setRates([]);
      }
    } catch (error) {
      console.error('Error fetching freight rates:', error);
      setError('Failed to connect to Freightos API. Please check your connection and try again.');
      toast.error('Failed to get freight rates from Freightos API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = (rate: any) => {
    console.log('Booking initiated for Freightos rate:', rate);
    // The booking modal will handle the booking process
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Getting Freight Rates
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Select Ports</span>
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
            rates.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {rates.length > 0 ? <CheckCircle className="w-4 h-4" /> : '3'}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            rates.length > 0 ? 'text-gray-900' : 'text-gray-500'
          }`}>Live Freightos Estimates</span>
        </div>
      </div>

      {/* Simplified Origin & Destination */}
      <SimplifiedOriginDestinationForm
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
              Ready to get live estimates from Freightos?
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
                  Getting Live Estimates from Freightos...
                </div>
              ) : (
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 mr-3" />
                  Get Live Freightos Estimates
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
            <div className="mx-6 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Your live Freightos estimates are ready!
            </div>
            <div className="border-t border-gray-200 flex-1"></div>
          </div>
          <FreightRatesDisplay 
            rates={rates} 
            onBooking={handleBooking}
            originData={{ address: formData.origin.portName }}
            destinationData={{ address: formData.destination.portName }}
            loadDetails={formData.loadDetails}
            requestParams={requestParams}
          />
        </>
      )}
    </div>
  );
};

export default FreightForwardingForm;
