
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit3, Check, FileText, Globe } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  index: number;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemove: (shipmentId: string) => void;
  onEdit: (shipmentId: string, details: any) => void;
  showCustomsButton?: boolean;
  onCustomsClick?: () => void;
  hasCustomsData?: boolean;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  index,
  onSelectRate,
  onRemove,
  onEdit,
  showCustomsButton = false,
  onCustomsClick,
  hasCustomsData = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const formatAddress = (details: any) => {
    if (!details) return 'Unknown Address';
    return `${details.to_street1}, ${details.to_city}, ${details.to_state} ${details.to_zip}, ${details.to_country}`;
  };

  const formatRate = (rate: number) => {
    return `$${rate?.toFixed(2) || '0.00'}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending_rates': { variant: 'outline' as const, text: 'Pending Rates' },
      'rates_fetched': { variant: 'secondary' as const, text: 'Rates Available' },
      'rate_selected': { variant: 'default' as const, text: 'Rate Selected' },
      'label_purchased': { variant: 'default' as const, text: 'Label Created' },
      'error': { variant: 'destructive' as const, text: 'Error' },
      'completed': { variant: 'default' as const, text: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <h3 className="text-lg font-semibold">{shipment.customer_name || shipment.recipient}</h3>
              {getStatusBadge(shipment.status)}
              {showCustomsButton && (
                <Badge variant={hasCustomsData ? "default" : "outline"} className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  International
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">To:</span> {formatAddress(shipment.details)}</p>
              {shipment.customer_company && (
                <p><span className="font-medium">Company:</span> {shipment.customer_company}</p>
              )}
              {shipment.customer_phone && (
                <p><span className="font-medium">Phone:</span> {shipment.customer_phone}</p>
              )}
              {shipment.details && (
                <p><span className="font-medium">Package:</span> {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}", {shipment.details.weight} lbs</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showCustomsButton && (
              <Button
                onClick={onCustomsClick}
                variant={hasCustomsData ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {hasCustomsData ? 'Edit Customs' : 'Add Customs'}
              </Button>
            )}
            
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
            
            <Button
              onClick={() => onRemove(shipment.id)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
          </div>
        </div>

        {/* Rate Selection */}
        {shipment.availableRates && shipment.availableRates.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Select Shipping Rate:</h4>
              {shipment.selectedRateId && (
                <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Rate Selected: {formatRate(shipment.rate || 0)}
                </div>
              )}
            </div>
            
            <Select
              value={shipment.selectedRateId || ''}
              onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose shipping rate..." />
              </SelectTrigger>
              <SelectContent>
                {shipment.availableRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{rate.carrier} - {rate.service}</span>
                      <span className="ml-2 font-semibold">${parseFloat(rate.rate.toString()).toFixed(2)}</span>
                      {rate.delivery_days && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({rate.delivery_days} day{rate.delivery_days !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Customs Status */}
        {showCustomsButton && hasCustomsData && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Customs documentation completed</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {shipment.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{shipment.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableShipmentRow;
