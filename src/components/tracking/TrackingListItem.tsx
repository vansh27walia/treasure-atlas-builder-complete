import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Truck, MapPin, Clock, ExternalLink, Eye, Mail } from 'lucide-react';
import { CancelLabelDialog } from '@/components/shipping/CancelLabelDialog';
import PrintPreview from '@/components/shipping/PrintPreview';
import { toast } from 'sonner';

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
    case 'cancelled':
    case 'canceled':
      return <span className="text-red-600 font-bold text-xl">✕</span>;
    default: 
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

// Helper function to check if label can be cancelled
const canCancelLabel = (status: string) => {
  const ineligibleStatuses = ['cancelled', 'canceled', 'refund_pending', 'delivered', 'out_for_delivery', 'in_transit'];
  return !ineligibleStatuses.includes(status.toLowerCase());
};

const TrackingListItem: React.FC<TrackingListItemProps> = ({ 
  item, 
  isSelected, 
  onSelect 
}) => {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'delivered': 
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'in_transit': 
        return <Badge className="bg-blue-500">In Transit</Badge>;
      case 'out_for_delivery': 
        return <Badge className="bg-purple-500">Out for Delivery</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-500">Canceled</Badge>;
      case 'refund_pending':
        return <Badge className="bg-orange-500">Refund Pending</Badge>;
      default: 
        return <Badge className="bg-gray-500">Processing</Badge>;
    }
  };

  const canCancelLabel = (status: string) => {
    const ineligibleStatuses = ['cancelled', 'canceled', 'refund_pending', 'delivered', 'out_for_delivery', 'in_transit'];
    return !ineligibleStatuses.includes(status.toLowerCase());
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

  const isCanceled = item.status === 'cancelled' || item.status === 'canceled';

  return (
    <div className={`border rounded-md overflow-hidden shadow-sm ${isCanceled ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
      <div 
        className={`p-4 flex justify-between items-center cursor-pointer ${isCanceled ? 'hover:bg-red-100' : 'hover:bg-gray-50'}`}
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
              {getStatusBadge(item.status)}
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
  const isCanceled = item.status === 'cancelled' || item.status === 'canceled';
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [openToEmailTab, setOpenToEmailTab] = useState(false);

  const convertPngTo4x6Pdf = async (imageUrl: string): Promise<Blob> => {
    const { PDFDocument } = await import('pdf-lib');
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const imageBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(imageBytes);
    const labelWidth = 288;
    const labelHeight = 432;
    const page = pdfDoc.addPage([labelWidth, labelHeight]);
    const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
    const scaleX = labelWidth / imgWidth;
    const scaleY = labelHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const x = (labelWidth - scaledWidth) / 2;
    const y = (labelHeight - scaledHeight) / 2;
    page.drawImage(pngImage, { x, y, width: scaledWidth, height: scaledHeight });
    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const handleDirectDownload = async () => {
    if (!item.label_url) {
      toast.error('Label URL not available');
      return;
    }
    try {
      toast.loading('Preparing 4x6 PDF label...');
      let blob: Blob;
      if (item.label_url.toLowerCase().includes('.png')) {
        blob = await convertPngTo4x6Pdf(item.label_url);
      } else if (item.label_url.toLowerCase().includes('.pdf')) {
        const response = await fetch(item.label_url);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
        blob = await response.blob();
      } else {
        blob = await convertPngTo4x6Pdf(item.label_url);
      }
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `shipping_label_4x6_${item.tracking_code || item.shipment_id || Date.now()}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      toast.dismiss();
      toast.success('4x6 PDF label downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handlePrintPreview = () => {
    setOpenToEmailTab(false);
    setIsPreviewOpen(true);
  };

  const handleEmailLabel = () => {
    setOpenToEmailTab(true);
    setIsPreviewOpen(true);
  };

  const shipmentDetails = {
    fromAddress: 'Pickup Address',
    toAddress: item.recipient_address,
    weight: item.package_details.weight,
    dimensions: item.package_details.dimensions,
    service: item.package_details.service,
    carrier: item.carrier
  };
  
  return (
    <div className={`px-4 pb-4 pt-2 border-t ${isCanceled ? 'bg-red-50' : 'bg-gray-50'}`}>
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

      {/* Display canceled message */}
      {isCanceled && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-2xl">✕</span>
            <p className="text-red-800 font-semibold text-lg">This label has been canceled</p>
          </div>
          <p className="text-red-700 text-sm mt-2">Tracking Number: {item.tracking_code}</p>
        </div>
      )}

      {/* Display refund pending message */}
      {item.status === 'refund_pending' && (
        <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-orange-800 font-semibold text-lg">Refund in Progress</p>
              <p className="text-orange-700 text-sm mt-1">Your refund has been submitted and will be processed within 48 hours.</p>
            </div>
          </div>
        </div>
      )}

      {/* Display Label URL if available and not canceled */}
      {!isCanceled && item.label_url && (
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
      
      {!isCanceled && item.status !== 'refund_pending' && <h4 className="text-sm font-semibold mb-3">Tracking History</h4>}
      {!isCanceled && item.status !== 'refund_pending' && (
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
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end mt-4 gap-2">
        {!isCanceled && item.status !== 'refund_pending' && item.label_url && (
          <>
            {/* View Button */}
            <Button
              size="sm"
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
              asChild
            >
              <a href={item.label_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </a>
            </Button>

            {/* Download Button */}
            <Button
              size="sm"
              variant="outline"
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
              onClick={handleDirectDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>

            {/* Print Preview Button */}
            <PrintPreview
              labelUrl={item.label_url}
              trackingCode={item.tracking_code}
              shipmentId={item.shipment_id}
              shipmentDetails={shipmentDetails}
              isOpenProp={isPreviewOpen}
              onOpenChangeProp={setIsPreviewOpen}
              openToEmailTab={openToEmailTab}
              triggerButton={
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-200 hover:bg-purple-50 text-purple-700"
                  onClick={handlePrintPreview}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Print Preview
                </Button>
              }
            />

            {/* Email Button */}
            <Button
              size="sm"
              variant="outline"
              className="border-green-200 hover:bg-green-50 text-green-700"
              onClick={handleEmailLabel}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          </>
        )}
        {canCancelLabel(item.status) && item.label_url && (
          <CancelLabelDialog
            shipmentId={item.shipment_id}
            trackingCode={item.tracking_code}
            carrier={item.carrier}
            service={item.package_details.service}
            fromAddress="Pickup Address"
            toAddress={item.recipient_address}
            trigger={
              <Button
                size="sm"
                variant="destructive"
              >
                Cancel Label
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default TrackingListItem;
