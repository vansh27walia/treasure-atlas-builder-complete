
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Package, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShipmentListItem {
  id: string;
  tracking_code: string;
  carrier: string;
  service: string;
  rate: number;
  status: string;
  label_url?: string;
  label_urls?: Record<string, string>;
  customer_name: string;
  customer_address: string;
}

interface ShipmentListProps {
  shipments: ShipmentListItem[];
  onDownloadLabel: (labelUrl: string, format: string) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({
  shipments,
  onDownloadLabel
}) => {
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const handleDownloadSingle = (shipment: ShipmentListItem, format: string = 'pdf') => {
    let labelUrl = '';
    
    if (shipment.label_urls && shipment.label_urls[format]) {
      labelUrl = shipment.label_urls[format];
    } else if (shipment.label_url) {
      labelUrl = shipment.label_url;
    }
    
    if (!labelUrl) {
      toast.error(`No ${format.toUpperCase()} label available for this shipment`);
      return;
    }
    
    onDownloadLabel(labelUrl, format);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (shipmentId: string) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Truck className="mr-2 h-5 w-5" />
        Individual Shipments ({shipments.length})
      </h3>
      
      {shipments.map((shipment) => (
        <Card key={shipment.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{shipment.tracking_code}</span>
                <Badge className={getStatusColor(shipment.status)}>
                  {shipment.status}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>To:</strong> {shipment.customer_name}</p>
                <p><strong>Address:</strong> {shipment.customer_address}</p>
                <p><strong>Carrier:</strong> {shipment.carrier} - {shipment.service}</p>
                <p><strong>Rate:</strong> ${shipment.rate}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleExpanded(shipment.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {expandedShipment === shipment.id ? 'Less' : 'More'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleDownloadSingle(shipment, 'pdf')}
                disabled={!shipment.label_url && !shipment.label_urls?.pdf}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
          
          {expandedShipment === shipment.id && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-3">Available Label Formats</h4>
              <div className="flex flex-wrap gap-2">
                {shipment.label_urls ? (
                  Object.entries(shipment.label_urls).map(([format, url]) => (
                    <Button
                      key={format}
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadSingle(shipment, format)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {format.toUpperCase()}
                    </Button>
                  ))
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadSingle(shipment, 'pdf')}
                    disabled={!shipment.label_url}
                    className="text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
              
              {shipment.label_url && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    <strong>Label URL:</strong> 
                    <a 
                      href={shipment.label_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      View in browser
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ShipmentList;
