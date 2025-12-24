
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Mail, 
  Printer, 
  Copy, 
  Eye, 
  Package, 
  Truck,
  Calendar,
  MapPin,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: {
    labelUrl: string;
    trackingCode: string;
    shipmentId: string;
    carrier?: string;
    service?: string;
    cost: number;
    isInternational?: boolean;
    fromAddress?: any;
    toAddress?: any;
  };
}

const EnhancedLabelModal: React.FC<EnhancedLabelModalProps> = ({
  isOpen,
  onClose,
  labelData
}) => {
  const [labelFormat, setLabelFormat] = useState('PDF');
  const [labelSize, setLabelSize] = useState('4x6');
  const [emailAddress, setEmailAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatOptions = [
    { value: 'PDF', label: 'PDF' },
    { value: 'PNG', label: 'PNG' },
    { value: 'ZPL', label: 'ZPL (Thermal)' }
  ];

  const sizeOptions = [
    { value: '4x6', label: '4" x 6"' },
    { value: '4x8', label: '4" x 8"' },
    { value: '6x4', label: '6" x 4"' }
  ];

  const handleDownload = () => {
    if (labelData.labelUrl) {
      const link = document.createElement('a');
      link.href = labelData.labelUrl;
      link.download = `label-${labelData.trackingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Label downloaded successfully');
    }
  };

  const handlePrint = () => {
    if (labelData.labelUrl) {
      const printWindow = window.open(labelData.labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Opening label for printing');
    }
  };

  const handleEmailLabel = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: {
          email: emailAddress,
          labelUrl: labelData.labelUrl,
          trackingCode: labelData.trackingCode,
          carrier: labelData.carrier,
          service: labelData.service
        }
      });

      if (error) throw error;
      toast.success(`Label emailed to ${emailAddress}`);
      setEmailAddress('');
    } catch (error) {
      console.error('Error emailing label:', error);
      toast.error('Failed to email label');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(labelData.trackingCode);
    toast.success('Tracking number copied to clipboard');
  };

  const openTracking = () => {
    const trackingUrls: { [key: string]: string } = {
      'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${labelData.trackingCode}`,
      'ups': `https://www.ups.com/track?loc=en_US&tracknum=${labelData.trackingCode}`,
      'fedex': `https://www.fedex.com/fedextrack/?trknbr=${labelData.trackingCode}`,
      'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${labelData.trackingCode}`
    };

    const url = trackingUrls[labelData.carrier?.toLowerCase() || ''];
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Tracking URL not available for this carrier');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Shipping Label Created Successfully
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Label Preview */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Label Preview
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                  {labelData.labelUrl ? (
                    <iframe
                      src={labelData.labelUrl}
                      className="w-full h-[300px] border-0"
                      title="Shipping Label Preview"
                    />
                  ) : (
                    <div className="text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p>Label preview not available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Format Options */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Download Options</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={labelFormat} onValueChange={setLabelFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Select value={labelSize} onValueChange={setLabelSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipment Details */}
          <div className="space-y-4">
            {/* Tracking Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Tracking Number</p>
                      <p className="font-mono text-lg font-semibold">{labelData.trackingCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyTrackingNumber}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" onClick={openTracking}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Carrier</p>
                      <Badge variant="outline" className="mt-1">
                        {labelData.carrier?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium">{labelData.service}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Label */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Label
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleEmailLabel} 
                    disabled={isProcessing}
                    className="shrink-0"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Shipment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Shipping Cost</span>
                    <span className="font-medium">${labelData.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance</span>
                    <span className="font-medium">$4.00</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Paid</span>
                    <span>${(labelData.cost + 4).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(labelData.fromAddress || labelData.toAddress) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Addresses
                  </h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    {labelData.fromAddress && (
                      <div>
                        <p className="font-medium text-green-600 mb-1">From:</p>
                        <p>{labelData.fromAddress.name}</p>
                        <p>{labelData.fromAddress.street1}</p>
                        <p>{labelData.fromAddress.city}, {labelData.fromAddress.state} {labelData.fromAddress.zip}</p>
                      </div>
                    )}
                    {labelData.toAddress && (
                      <div>
                        <p className="font-medium text-blue-600 mb-1">To:</p>
                        <p>{labelData.toAddress.name}</p>
                        <p>{labelData.toAddress.street1}</p>
                        <p>{labelData.toAddress.city}, {labelData.toAddress.state} {labelData.toAddress.zip}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.location.href = '/tracking'}>
            View in Tracking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedLabelModal;
