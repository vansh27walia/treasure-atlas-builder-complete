import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, CheckCircle, Truck, MapPin, Clock, ExternalLink, Eye, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
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

const getStatusIcon = (status: string) => {
  switch (status) {
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
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

const canCancelLabel = (status: string) => {
  const ineligibleStatuses = ['cancelled', 'canceled', 'refund_pending', 'delivered', 'out_for_delivery', 'in_transit'];
  return !ineligibleStatuses.includes(status.toLowerCase());
};

const TrackingListItem: React.FC<TrackingListItemProps> = ({
  item,
  isSelected,
  onSelect
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Delivered</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Transit</Badge>;
      case 'out_for_delivery':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Out for Delivery</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Canceled</Badge>;
      case 'refund_pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Refund Pending</Badge>;
      default:
        return <Badge variant="secondary">Processing</Badge>;
    }
  };

  const getEstimatedDeliveryText = (item: TrackingInfo) => {
    if (item.status === 'delivered') {
      return 'Delivered on ' + new Date(item.last_update).toLocaleDateString();
    }
    if (item.estimated_delivery) {
      return `Est. ${new Date(item.estimated_delivery.date).toLocaleDateString()} ${item.estimated_delivery.time_range}`;
    }
    if (item.eta) {
      return 'Est. ' + new Date(item.eta).toLocaleDateString();
    }
    return 'No ETA available';
  };

  const handleTrackingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tracking?search=${encodeURIComponent(item.tracking_code)}`);
  };

  const isCanceled = item.status === 'cancelled' || item.status === 'canceled';

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${isCanceled ? 'border-red-200 bg-red-50/50' : isSelected ? 'border-primary/40 shadow-md' : 'hover:shadow-md hover:border-primary/20'}`}>
      {/* Header Row */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => onSelect(item.tracking_code)}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Status Icon */}
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
            item.status === 'delivered' ? 'bg-green-100' :
            item.status === 'in_transit' ? 'bg-blue-100' :
            item.status === 'out_for_delivery' ? 'bg-purple-100' :
            isCanceled ? 'bg-red-100' : 'bg-muted'
          }`}>
            {getStatusIcon(item.status)}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{item.carrier}</span>
              <span className="text-muted-foreground">•</span>
              <button
                onClick={handleTrackingClick}
                className="font-mono text-sm text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {item.tracking_code}
              </button>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              To: {item.recipient} — {item.recipient_address}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {getStatusBadge(item.status)}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {getEstimatedDeliveryText(item)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <Badge variant="outline" className="hidden md:flex text-xs">
            {item.package_details.service}
          </Badge>
          {item.label_url && !isCanceled && (
            <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0" asChild>
              <a href={item.label_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
          {isSelected ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isSelected && <TrackingDetails item={item} />}
    </Card>
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
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
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
    if (!item.label_url) { toast.error('Label URL not available'); return; }
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

  const handlePrintPreview = () => { setOpenToEmailTab(false); setIsPreviewOpen(true); };

  const shipmentDetails = {
    fromAddress: 'Pickup Address',
    toAddress: item.recipient_address,
    weight: item.package_details.weight,
    dimensions: item.package_details.dimensions,
    service: item.package_details.service,
    carrier: item.carrier
  };

  return (
    <div className={`px-4 pb-4 pt-3 border-t ${isCanceled ? 'bg-red-50' : 'bg-muted/30'}`}>
      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Package Details</p>
          <p className="text-sm">Weight: {item.package_details.weight}</p>
          <p className="text-sm">Dimensions: {item.package_details.dimensions}</p>
          <p className="text-sm">Service: {item.package_details.service}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipient</p>
          <p className="text-sm font-medium">{item.recipient}</p>
          <p className="text-sm text-muted-foreground">{item.recipient_address}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shipment ID</p>
          <p className="text-sm font-mono">{item.shipment_id}</p>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">Last Updated</p>
          <p className="text-sm">{new Date(item.last_update).toLocaleString()}</p>
        </div>
      </div>

      {/* Canceled notice */}
      {isCanceled && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-2xl">✕</span>
            <p className="text-red-800 font-semibold text-lg">This label has been canceled</p>
          </div>
          <p className="text-red-700 text-sm mt-2">Tracking Number: {item.tracking_code}</p>
        </div>
      )}

      {/* Refund pending */}
      {item.status === 'refund_pending' && (
        <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-orange-800 font-semibold text-lg">Refund in Progress</p>
              <p className="text-orange-700 text-sm mt-1">Your refund will be processed within 48 hours.</p>
            </div>
          </div>
        </div>
      )}

      {/* Label URL */}
      {!isCanceled && item.label_url && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Shipping Label</p>
              <p className="text-xs text-muted-foreground break-all mt-0.5">{item.label_url}</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={item.label_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <ExternalLink className="h-3 w-3 mr-1" /> View
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Tracking Timeline */}
      {!isCanceled && item.status !== 'refund_pending' && item.tracking_events && item.tracking_events.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
          <div className="relative pl-6">
            <div className="absolute top-0 bottom-0 left-[11px] w-[2px] bg-border"></div>
            {item.tracking_events.map((event) => (
              <div key={event.id} className="flex mb-4 relative">
                <div className={`absolute -left-[14px] h-6 w-6 rounded-full flex items-center justify-center z-10 ${
                  event.status === 'delivered' ? 'bg-green-500' :
                  event.status === 'in_transit' ? 'bg-blue-500' :
                  event.status === 'out_for_delivery' ? 'bg-purple-500' : 'bg-muted-foreground/30'
                }`}>
                  <div className="h-2 w-2 bg-white rounded-full" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground">{event.location}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-end mt-4 gap-2">
        {!isCanceled && item.status !== 'refund_pending' && item.label_url && (
          <>
            <Button size="sm" variant="outline" asChild>
              <a href={item.label_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> View
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={handleDirectDownload}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <PrintPreview
              labelUrl={item.label_url}
              trackingCode={item.tracking_code}
              shipmentId={item.shipment_id}
              shipmentDetails={shipmentDetails}
              isOpenProp={isPreviewOpen}
              onOpenChangeProp={setIsPreviewOpen}
              openToEmailTab={openToEmailTab}
              triggerButton={
                <Button size="sm" variant="outline" onClick={handlePrintPreview}>
                  <Eye className="h-4 w-4 mr-1" /> Print Preview
                </Button>
              }
            />
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
            trigger={<Button size="sm" variant="destructive">Cancel Label</Button>}
          />
        )}
      </div>
    </div>
  );
};

export default TrackingListItem;
