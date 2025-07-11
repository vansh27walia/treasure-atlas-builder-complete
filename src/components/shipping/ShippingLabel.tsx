
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Package } from 'lucide-react';

interface ShippingLabelProps {
  labelUrl?: string;
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  onDownload?: () => void;
  onPrint?: () => void;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({
  labelUrl,
  trackingNumber,
  carrier,
  service,
  onDownload,
  onPrint
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Shipping Label
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackingNumber && (
          <div>
            <p className="text-sm text-gray-600">Tracking Number</p>
            <p className="font-mono text-lg">{trackingNumber}</p>
          </div>
        )}
        
        {carrier && service && (
          <div>
            <p className="text-sm text-gray-600">Service</p>
            <p className="font-medium">{carrier} {service}</p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={onDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Label
          </Button>
          <Button 
            onClick={onPrint}
            variant="outline"
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </Button>
        </div>

        {labelUrl && (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={labelUrl}
              width="100%"
              height="400px"
              title="Shipping Label"
              className="border-0"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingLabel;
