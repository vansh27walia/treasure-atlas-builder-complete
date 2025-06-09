
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShipmentData {
  id: string;
  status: string;
  tracking_code?: string;
  tracking_number?: string;
  trackingCode?: string;
  label_url?: string;
  label_urls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  carrier?: string;
  service?: string;
  rate?: string | number;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
  recipient?: string;
  details?: any;
}

interface SuccessfulShipmentsTableProps {
  shipments: ShipmentData[];
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onDownloadAllLabels: () => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel,
  onDownloadAllLabels
}) => {
  console.log('SuccessfulShipmentsTable received shipments:', shipments);

  const getTrackingNumber = (shipment: ShipmentData): string => {
    return shipment.tracking_code || shipment.tracking_number || shipment.trackingCode || 'N/A';
  };

  const getLabelUrl = (shipment: ShipmentData): string | null => {
    if (shipment.label_urls?.png) return shipment.label_urls.png;
    if (shipment.label_url) return shipment.label_url;
    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Processing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status || 'Unknown'}</Badge>;
    }
  };

  const handleDownloadLabel = async (shipment: ShipmentData) => {
    const labelUrl = getLabelUrl(shipment);
    if (!labelUrl || labelUrl.trim() === '') {
      toast.error('No label available for this shipment');
      return;
    }

    try {
      console.log('Downloading label for shipment:', shipment.id, 'URL:', labelUrl);
      onDownloadSingleLabel(labelUrl, 'png');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label');
    }
  };

  const hasLabels = shipments.some(shipment => getLabelUrl(shipment));

  if (!shipments || shipments.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No shipments to display</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Shipment Details</h3>
          <p className="text-sm text-gray-600">
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} processed
          </p>
        </div>
        
        {hasLabels && (
          <Button 
            onClick={onDownloadAllLabels}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Labels
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {shipments.map((shipment, index) => {
          const trackingNumber = getTrackingNumber(shipment);
          const labelUrl = getLabelUrl(shipment);
          const hasLabel = !!(labelUrl && labelUrl.trim() !== '');

          return (
            <div key={shipment.id || index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                <div className="flex items-center space-x-3 mb-2 lg:mb-0">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Shipment #{index + 1}</h4>
                    <p className="text-sm text-gray-600">ID: {shipment.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusBadge(shipment.status)}
                  {hasLabel && (
                    <Button
                      size="sm"
                      onClick={() => handleDownloadLabel(shipment)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download Label
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tracking Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">Shipping Details</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Tracking:</span> {trackingNumber}
                    </p>
                    {shipment.carrier && (
                      <p className="text-sm">
                        <span className="font-medium">Carrier:</span> {shipment.carrier}
                      </p>
                    )}
                    {shipment.service && (
                      <p className="text-sm">
                        <span className="font-medium">Service:</span> {shipment.service}
                      </p>
                    )}
                    {shipment.rate && (
                      <p className="text-sm">
                        <span className="font-medium">Rate:</span> ${typeof shipment.rate === 'string' ? shipment.rate : shipment.rate.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">Customer Details</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {(shipment.customer_name || shipment.recipient) && (
                      <p className="text-sm">
                        <span className="font-medium">Name:</span> {shipment.customer_name || shipment.recipient}
                      </p>
                    )}
                    {shipment.customer_company && (
                      <p className="text-sm flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        {shipment.customer_company}
                      </p>
                    )}
                    {shipment.customer_address && (
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {shipment.customer_address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">Contact Info</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {shipment.customer_phone && (
                      <p className="text-sm flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {shipment.customer_phone}
                      </p>
                    )}
                    {shipment.customer_email && (
                      <p className="text-sm flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {shipment.customer_email}
                      </p>
                    )}
                    {!shipment.customer_phone && !shipment.customer_email && (
                      <p className="text-sm text-gray-500">No contact info</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Label Status */}
              {hasLabel ? (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Label created successfully and ready for download
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Label not available - processing may have failed
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SuccessfulShipmentsTable;
