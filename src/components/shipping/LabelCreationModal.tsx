import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, CheckCircle, Truck, Package, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface LabelCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: {
    labelUrl: string;
    trackingCode: string;
    shipmentId: string;
    fromAddress: any;
    toAddress: any;
    carrier: string;
    service: string;
    cost: number;
    estimatedDelivery?: string;
    isInternational?: boolean;
  } | null;
}

const LabelCreationModal: React.FC<LabelCreationModalProps> = ({
  isOpen,
  onClose,
  labelData
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownloadLabel = async () => {
    if (!labelData?.labelUrl) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(labelData.labelUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `shipping-label-${labelData.trackingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Label downloaded successfully');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!labelData?.labelUrl) return;
    
    setIsPrinting(true);
    try {
      const printWindow = window.open(labelData.labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Label sent to printer');
    } catch (error) {
      console.error('Error printing label:', error);
      toast.error('Failed to print label');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleTrackPackage = () => {
    if (!labelData?.trackingCode) return;
    
    let trackingUrl = '';
    const carrier = labelData.carrier.toLowerCase();
    
    switch (carrier) {
      case 'usps':
        trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${labelData.trackingCode}`;
        break;
      case 'ups':
        trackingUrl = `https://www.ups.com/track?loc=en_US&tracknum=${labelData.trackingCode}`;
        break;
      case 'fedex':
        trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${labelData.trackingCode}`;
        break;
      case 'dhl':
        trackingUrl = `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${labelData.trackingCode}`;
        break;
      default:
        toast.info('Please visit the carrier website to track your package');
        return;
    }
    
    window.open(trackingUrl, '_blank');
  };

  if (!isOpen || !labelData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-green-700">
            Shipping Label Created Successfully!
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Your {labelData.isInternational ? 'international' : 'domestic'} shipping label is ready
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tracking Information */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Truck className="w-5 h-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tracking Number</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono bg-white px-2 py-1 rounded border">
                      {labelData.trackingCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTrackPackage}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Track
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Carrier & Service</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {labelData.carrier.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{labelData.service}</span>
                  </div>
                </div>
              </div>
              
              {labelData.estimatedDelivery && (
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Estimated Delivery
                  </p>
                  <p className="text-sm text-gray-600">{labelData.estimatedDelivery}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <MapPin className="w-4 h-4" />
                  From
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{labelData.fromAddress.name}</p>
                  {labelData.fromAddress.company && (
                    <p className="text-gray-600">{labelData.fromAddress.company}</p>
                  )}
                  <p>{labelData.fromAddress.street1}</p>
                  {labelData.fromAddress.street2 && <p>{labelData.fromAddress.street2}</p>}
                  <p>
                    {labelData.fromAddress.city}, {labelData.fromAddress.state} {labelData.fromAddress.zip}
                  </p>
                  {labelData.fromAddress.country && labelData.fromAddress.country !== 'US' && (
                    <p>{labelData.fromAddress.country}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* To Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <MapPin className="w-4 h-4" />
                  To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{labelData.toAddress.name}</p>
                  {labelData.toAddress.company && (
                    <p className="text-gray-600">{labelData.toAddress.company}</p>
                  )}
                  <p>{labelData.toAddress.street1}</p>
                  {labelData.toAddress.street2 && <p>{labelData.toAddress.street2}</p>}
                  <p>
                    {labelData.toAddress.city}, {labelData.toAddress.state} {labelData.toAddress.zip}
                  </p>
                  {labelData.toAddress.country && labelData.toAddress.country !== 'US' && (
                    <p>{labelData.toAddress.country}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cost Information */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="text-lg font-bold text-green-600">
                  ${labelData.cost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleDownloadLabel}
              disabled={isDownloading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Label'}
            </Button>
            
            <Button
              onClick={handlePrintLabel}
              disabled={isPrinting}
              variant="outline"
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print Label'}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Done
            </Button>
          </div>

          {/* Additional Information */}
          {labelData.isInternational && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Package className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">International Shipping</p>
                    <p className="text-sm text-yellow-700">
                      Customs documentation has been included with your label. 
                      Ensure all customs forms are properly attached to your package.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelCreationModal;
