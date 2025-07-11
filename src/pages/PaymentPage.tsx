
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

const PaymentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-6 w-6" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Payment functionality is now integrated directly into the shipping workflow. 
              You can manage your payment methods in Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
