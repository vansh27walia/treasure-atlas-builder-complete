
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';

const InternationalShippingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  const handleRateSelect = (rateId: string) => {
    setSelectedRate(rateId);
  };

  const handleCreateLabel = () => {
    // Handle label creation logic
    console.log('Creating international label for rate:', selectedRate);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <Globe className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-3xl font-bold">International Shipping</h1>
            </div>
            <p className="text-gray-600">Ship packages worldwide with competitive international rates</p>
          </div>
          
          <EnhancedShippingForm 
            isInternational={true}
            onRateSelect={handleRateSelect}
            onCreateLabel={handleCreateLabel}
            selectedRateId={selectedRate}
          />
        </div>
      </main>
    </div>
  );
};

export default InternationalShippingPage;
