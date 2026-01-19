import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Edit, Check, ArrowRight } from 'lucide-react';

interface Address {
  name?: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface AIAddressCardProps {
  pickupAddress?: Address;
  dropoffAddress?: Address;
  onEdit?: () => void;
  onConfirm?: () => void;
  isConfirmed?: boolean;
}

const AIAddressCard: React.FC<AIAddressCardProps> = ({ 
  pickupAddress, 
  dropoffAddress, 
  onEdit, 
  onConfirm,
  isConfirmed 
}) => {
  const formatAddress = (addr?: Address) => {
    if (!addr) return 'Not specified';
    return `${addr.street1}, ${addr.city}, ${addr.state} ${addr.zip}`;
  };

  return (
    <Card className={`overflow-hidden transition-all ${isConfirmed ? 'ring-2 ring-green-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            Shipping Route
          </h4>
          {isConfirmed && <Check className="w-5 h-5 text-green-500" />}
        </div>

        <div className="space-y-4">
          {/* From Address */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-600">FROM</span>
            </div>
            <div className="flex-1">
              {pickupAddress?.name && (
                <p className="font-medium text-gray-900">{pickupAddress.name}</p>
              )}
              <p className="text-sm text-gray-600">{formatAddress(pickupAddress)}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-gray-300 rotate-90" />
          </div>

          {/* To Address */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-green-600">TO</span>
            </div>
            <div className="flex-1">
              {dropoffAddress?.name && (
                <p className="font-medium text-gray-900">{dropoffAddress.name}</p>
              )}
              <p className="text-sm text-gray-600">{formatAddress(dropoffAddress)}</p>
            </div>
          </div>
        </div>

        {(onEdit || onConfirm) && (
          <div className="mt-4 flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                <Edit className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
            {onConfirm && !isConfirmed && (
              <Button size="sm" onClick={onConfirm} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Check className="w-3 h-3 mr-1" /> Confirm
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAddressCard;
