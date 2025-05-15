
import React from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  ExternalLink,
  FileText 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => void;
  onPreviewLabel?: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onPreviewLabel
}) => {
  if (shipments.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <p className="text-gray-500">No shipments found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {shipments.map((shipment) => (
        <Card 
          key={shipment.id} 
          className={`p-4 shadow-sm overflow-hidden border-l-4 ${
            shipment.status === 'completed' ? 'border-l-green-500' : 
            shipment.status === 'error' ? 'border-l-red-500' : 
            shipment.selectedRateId ? 'border-l-blue-500' : 'border-l-gray-300'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="font-medium text-gray-800">
                    {shipment.recipient || shipment.details.name}
                  </h3>
                  {shipment.status === 'completed' && (
                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                      Label Created
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRefreshRates(shipment.id)}
                    disabled={isFetchingRates}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveShipment(shipment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="text-sm">
                    {shipment.details.name}
                    {shipment.details.company && `, ${shipment.details.company}`}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm">{shipment.details.street1}</p>
                  <p className="text-sm">
                    {shipment.details.city}, {shipment.details.state} {shipment.details.zip}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Package</p>
                  <p className="text-sm">
                    {shipment.details.parcel_weight ? `${shipment.details.parcel_weight} lbs` : 'Weight not specified'}
                    {(shipment.details.parcel_length && shipment.details.parcel_width && shipment.details.parcel_height) ? 
                      ` - ${shipment.details.parcel_length}x${shipment.details.parcel_width}x${shipment.details.parcel_height} in` : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
              <div>
                <p className="text-xs text-gray-500 mb-1">Shipping Option</p>
                {shipment.status === 'completed' ? (
                  <div className="flex items-center text-sm font-medium text-gray-800">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    {shipment.carrier} - {shipment.service}
                    <span className="ml-auto font-semibold">${shipment.rate.toFixed(2)}</span>
                  </div>
                ) : (
                  <Select
                    defaultValue={shipment.selectedRateId || ''}
                    onValueChange={(value) => onSelectRate(shipment.id, value)}
                    disabled={!shipment.availableRates || shipment.availableRates.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {!shipment.availableRates || shipment.availableRates.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          {isFetchingRates ? 'Loading rates...' : 'No rates available'}
                        </SelectItem>
                      ) : (
                        shipment.availableRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            {rate.carrier} {rate.service} - ${rate.rate.toFixed(2)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex justify-between mt-3">
                {shipment.status === 'completed' && shipment.label_url ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 border-blue-200"
                      onClick={() => onPreviewLabel && onPreviewLabel(shipment.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    
                    {shipment.tracking_code && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600"
                        asChild
                      >
                        <a href={`/tracking?code=${shipment.tracking_code}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Track
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      /* You would implement the edit shipment modal here */
                      console.log('Edit shipment:', shipment.id);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
