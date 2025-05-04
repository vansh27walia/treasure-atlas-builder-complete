
import React from 'react';
import { Card } from '@/components/ui/card';

const EmptyRatesState: React.FC = () => {
  return (
    <Card className="border-2 border-gray-200">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Available Shipping Rates</h2>
        <p className="text-center py-8 text-gray-500">
          Fill out the shipping form and click "Show Shipping Rates" to see available rates.
        </p>
      </div>
    </Card>
  );
};

export default EmptyRatesState;
