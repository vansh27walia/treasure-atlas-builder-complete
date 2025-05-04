
import React from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const EmptyRatesState: React.FC = () => {
  return (
    <Card className="border-2 border-dashed border-gray-300 p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Shipping Rates Available</h3>
        <p className="text-gray-500 max-w-md mb-6">
          Enter your shipping details in the form above to see available rates from multiple carriers.
        </p>
        <Button className="flex items-center gap-2">
          Start New Shipment <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default EmptyRatesState;
