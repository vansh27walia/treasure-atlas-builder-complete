
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FreightForwardingForm from '@/components/freight/FreightForwardingForm';

const FreightForwardingPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Freight Forwarding</h1>
        <p className="text-gray-600">Get quotes for international freight shipping via air, sea, and land.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">FF</span>
            </div>
            Freight Forwarding Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FreightForwardingForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default FreightForwardingPage;
