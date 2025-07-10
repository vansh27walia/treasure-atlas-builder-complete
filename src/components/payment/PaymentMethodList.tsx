
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Building2, Smartphone, Trash2, Star } from 'lucide-react';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  stripe_payment_method_id: string;
}

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const getPaymentMethodIcon = (brand: string) => {
  const brandLower = brand?.toLowerCase();
  if (['visa', 'mastercard', 'amex', 'discover'].includes(brandLower)) {
    return <CreditCard className="w-5 h-5" />;
  } else if (brandLower === 'us_bank_account') {
    return <Building2 className="w-5 h-5" />;
  } else if (['link', 'apple_pay', 'google_pay', 'paypal'].includes(brandLower)) {
    return <Smartphone className="w-5 h-5" />;
  } else {
    return <CreditCard className="w-5 h-5" />;
  }
};

const getBrandColor = (brand: string) => {
  const brandLower = brand?.toLowerCase();
  const colors = {
    visa: 'text-blue-600 bg-blue-50',
    mastercard: 'text-red-600 bg-red-50',
    amex: 'text-green-600 bg-green-50',
    discover: 'text-orange-600 bg-orange-50',
    us_bank_account: 'text-purple-600 bg-purple-50',
    default: 'text-gray-600 bg-gray-50'
  };
  return colors[brandLower as keyof typeof colors] || colors.default;
};

const formatPaymentMethodDisplay = (method: PaymentMethod) => {
  if (method.brand === 'us_bank_account') {
    return `Bank Account •••• ${method.last4}`;
  } else if (['link', 'apple_pay', 'google_pay', 'paypal'].includes(method.brand?.toLowerCase())) {
    return `${method.brand} Wallet`;
  } else {
    return `${method.brand} •••• ${method.last4}`;
  }
};

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  paymentMethods,
  onDelete,
  onSetDefault,
}) => {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <Card key={method.id} className="transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBrandColor(method.brand)}`}>
                  {getPaymentMethodIcon(method.brand)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {formatPaymentMethodDisplay(method)}
                    </span>
                    {method.is_default && (
                      <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Default</span>
                      </Badge>
                    )}
                  </div>
                  
                  {method.exp_month && method.exp_year && (
                    <p className="text-sm text-gray-500">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!method.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetDefault(method.id)}
                    className="text-sm"
                  >
                    Set Default
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(method.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaymentMethodList;
