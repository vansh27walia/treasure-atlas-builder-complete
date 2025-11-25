import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Truck, MapPin, Clock, ExternalLink } from 'lucide-react';
import { CancelLabelDialog } from '@/components/shipping/CancelLabelDialog';

interface TrackingEvent {
  id: string;
  description: string;
  location: string;
  timestamp: string;
  status: string;
}

interface PackageDetails {
  weight: string;
  dimensions: string;
  service: string;
}

interface EstimatedDelivery {
  date: string;
  time_range: string;
}

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  carrier_code: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
  shipment_id: string;
  recipient: string;
  recipient_address: string;
  package_details: PackageDetails;
  estimated_delivery: EstimatedDelivery | null;
  tracking_events?: TrackingEvent[];
  is_canceled?: boolean;
}

interface TrackingListItemProps {
  item: TrackingInfo;
  isSelected: boolean;
  onSelect: (trackingCode: string) => void;
}

// Helper function for getting status icon
const getStatusIcon = (status: string) => {
  switch(status) {
    case 'delivered': 
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'in_transit': 
      return <Truck className="h-5 w-5 text-blue-500" />;
    case 'out_for_delivery': 
      return <MapPin className="h-5 w-5 text-purple-500" />;
    default: 
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const TrackingListItem: React.FC<TrackingListItemProps> = ({ 
  item, 
  isSelected, 
  onSelect 
}) => {
  const getStatusBadge = (status: string, isCanceled?: boolean) => {
    if (isCanceled) {
      return <Badge className="bg-red-500">Canceled</Badge>;
    }
    
    switch(status) {
      case 'delivered': 
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'in_transit': 
        return <Badge className="bg-blue-500">In Transit</Badge>;
      case 'out_for_delivery': 
        return <Badge className="bg-purple-500">Out for Delivery</Badge>;
      default: 
        return <Badge className="bg-gray-500">Processing</Badge>;
    }
  };

  const getEstimatedDeliveryText = (item: TrackingInfo) => {
    if (item.status === 'delivered') {
      return 'Delivered on ' + new Date(item.last_update).toLocaleDateString();
    }
    
    if (item.estimated_delivery) {
      return `Est. delivery: ${new Date(item.estimated_delivery.date).toLocaleDateString()} ${item.estimated_delivery.time_range}`;
    }
    
    if (item.eta) {
      return 'Est. delivery: ' + new Date(item.eta).toLocaleDateString();
    }
    
    return 'No estimated delivery time';
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => onSelect(item.tracking_code)}
      >
        <div className="flex items-center">
          {getStatusIcon(item.status)}
          <div className="ml-3">
            <div className="font-semibold flex items-center">
              {item.carrier} - {item.tracking_code}
            </div>
            <div className="text-sm text-gray-500">
              To: {item.recipient} • {item.recipient_address}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(item.status, item.is_canceled)}
              <span className="text-sm text-gray-500">
                {getEstimatedDeliveryText(item)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge variant="outline" className="hidden md:flex">
            {item.package_details.service}
          </Badge>
          
          {item.label_url && (
            <Button size="sm" variant="ghost" asChild className="rounded-full p-2">
              <a href={item.label_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {isSelected && (
        <TrackingDetails item={item} />
      )}
    </div>
  );
};

interface TrackingDetailsProps {
  item: TrackingInfo;
}

export const TrackingDetails: React.FC<TrackingDetailsProps> = ({ item }) => {
  return (
    <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
      {/* Show canceled message if label is canceled */}
      {item.is_canceled && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-lg font-bold text-red-600 text-center">
            Label Has Been Canceled
          </p>
          <p className="text-sm text-red-500 text-center mt-1">
            This label can no longer be used for shipping
          </p>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Package Details</p>
          <p className="text-sm">Weight: {item.package_details.weight}</p>
          <p className="text-sm">Dimensions: {item.package_details.dimensions}</p>
          <p className="text-sm">Service: {item.package_details.service}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Recipient</p>
          <p className="text-sm">{item.recipient}</p>
          <p className="text-sm">{item.recipient_address}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Shipment ID</p>
          <p className="text-sm">{item.shipment_id}</p>
          <p className="text-xs font-medium text-gray-500 mt-2">Last Updated</p>
          <p className="text-sm">{new Date(item.last_update).toLocaleString()}</p>
        </div>
      </div>

      {/* Display Label URL if available and not canceled */}
      {item.label_url && !item.is_canceled && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Shipping Label</p>
              <p className="text-xs text-blue-700 break-all">{item.label_url}</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a 
                href={item.label_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </a>
            </Button>
          </div>
        </div>
      )}
      
      <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-[16px] w-[2px] bg-gray-200"></div>
        {item.tracking_events?.map((event, index) => (
          <div key={event.id} className="flex mb-4 relative">
            <div className={`h-8 w-8 rounded-full ${
              event.status === 'delivered' ? 'bg-green-500' : 
              event.status === 'in_transit' ? 'bg-blue-500' : 
              event.status === 'out_for_delivery' ? 'bg-purple-500' : 
              'bg-gray-500'
            } flex items-center justify-center z-10`}>
              {getStatusIcon(event.status)}
            </div>
            <div className="ml-4">
              <div className="font-medium">{event.description}</div>
              <div className="text-sm text-gray-600">{event.location}</div>
              <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Only show action buttons if label is not canceled */}
      {!item.is_canceled && (
        <div className="flex justify-end mt-4 gap-2">
          {item.label_url && (
            <>
              <a 
                href={item.label_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                <Download className="mr-1 h-4 w-4" /> Download Label
              </a>
              <a 
                href={item.label_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                <ExternalLink className="mr-1 h-4 w-4" /> View Online
              </a>
              <CancelLabelDialog
                shipmentId={item.shipment_id}
                trackingCode={item.tracking_code}
                carrier={item.carrier}
                service={item.package_details.service}
                fromAddress="Pickup Address"
                toAddress={item.recipient_address}
                onSuccess={() => window.location.reload()}
                trigger={
                  <button className="flex items-center px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm">
                    Cancel Label
                  </button>
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingListItem;
