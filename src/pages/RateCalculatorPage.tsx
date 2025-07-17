
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import IndependentRateCalculator from '@/components/shipping/IndependentRateCalculator';

const RateCalculatorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rate Calculator</h1>
              <p className="text-gray-600">Compare domestic and international shipping rates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Rate Calculator */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <IndependentRateCalculator />
        </div>
      </div>
    </div>
  );
};

export default RateCalculatorPage;
