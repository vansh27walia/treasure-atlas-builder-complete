
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onDelete,
  onSetDefault,
}) => {
  const brandColors = {
    visa: 'bg-blue-500',
    mastercard: 'bg-red-500',
    amex: 'bg-green-500',
    discover: 'bg-orange-500',
  };

  const brandColor = brandColors[paymentMethod.brand?.toLowerCase() as keyof typeof brandColors] || 'bg-gray-500';

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded ${brandColor} flex items-center justify-center`}>
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium capitalize">
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </span>
                {paymentMethod.is_default && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Expires {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!paymentMethod.is_default && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDefault(paymentMethod.id)}
              >
                Set Default
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(paymentMethod.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodCard;
