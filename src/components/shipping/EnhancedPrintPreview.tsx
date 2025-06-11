
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Mail, FileText, FileImage, FileArchive, X, Eye, Package, Truck } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface EnhancedPrintPreviewProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
    deliveryDays?: number;
    estimatedDeliveryDate?: string;
  };
  onFormatChange?: (format: string) => Promise<void>;
}

const EnhancedPrintPreview: React.FC<EnhancedPrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  labelUrls,
  shipmentDetails,
  onFormatChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedEmailFormat, setSelectedEmailFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => {
      toast.success('Print dialog opened');
      setIsOpen(false);
    },
    content: () => contentRef.current,
  });

  const handleFormatDownload = (format: 'png' | 'pdf' | 'zpl') => {
    const url = labelUrls?.[format] || labelUrl;
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available for this label`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${format.toUpperCase()} label`);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download label");
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const labelToSend = labelUrls?.[selectedEmailFormat] || labelUrl;
    if (!labelToSend) {
      toast.error(`${selectedEmailFormat.toUpperCase()} format not available`);
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const response = await fetch('/api/send-label-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          labelUrl: labelToSend,
          format: selectedEmailFormat,
          trackingNumber: trackingCode,
          shipmentId: shipmentId
        }),
      });

      if (response.ok) {
        toast.success(`Label sent to ${emailAddress} in ${selectedEmailFormat.toUpperCase()} format`);
        setEmailAddress('');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const formatDeliveryInfo = () => {
    if (shipmentDetails?.estimatedDeliveryDate) {
      const date = new Date(shipmentDetails.estimatedDeliveryDate);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (shipmentDetails?.deliveryDays) {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + shipmentDetails.deliveryDays);
      return `${shipmentDetails.deliveryDays} business days (by ${deliveryDate.toLocaleDateString()})`;
    }
    return 'Not available';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-12 px-8 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50">
          <Eye className="h-5 w-5" />
          View & Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <DialogTitle className="text-xl">Shipping Label Preview</DialogTitle>
                {trackingCode && (
                  <p className="text-sm text-gray-600">Tracking: {trackingCode}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Shipment Summary Card */}
        {shipmentDetails && (
          <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">Service</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {shipmentDetails.carrier.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{shipmentDetails.service}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Weight & Dimensions</Label>
                <p className="text-sm">{shipmentDetails.weight}</p>
                {shipmentDetails.dimensions && (
                  <p className="text-xs text-gray-500">{shipmentDetails.dimensions}</p>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Estimated Delivery
                </Label>
                <p className="text-sm font-medium text-green-700">{formatDeliveryInfo()}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600">Addresses</Label>
                <p className="text-xs text-gray-500 truncate">{shipmentDetails.fromAddress}</p>
                <p className="text-xs text-gray-500 truncate">→ {shipmentDetails.toAddress}</p>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Print Preview
            </TabsTrigger>
            <TabsTrigger value="formats" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Formats
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send via Email
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-center mb-4">
              <Button 
                onClick={handlePrint} 
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                size="lg"
              >
                <Printer className="h-5 w-5" />
                Print Label Now
              </Button>
            </div>

            <div ref={contentRef} className="flex justify-center bg-white p-6 border-2 border-gray-200 rounded-lg shadow-inner">
              <div className="max-w-lg">
                <img 
                  src={labelUrl} 
                  alt="Shipping Label" 
                  className="w-full border border-gray-300 rounded shadow-lg"
                />
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <p><strong>Print Instructions:</strong> Use 4x6 label paper or regular 8.5x11 paper. Ensure the label prints at 100% scale (no scaling).</p>
            </div>
          </TabsContent>

          <TabsContent value="formats" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Download in Different Formats</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 text-center hover:border-red-300 transition-colors border-2">
                <FileText className="h-16 w-16 mx-auto mb-4 text-red-600" />
                <h4 className="font-medium mb-2 text-lg">PDF Format</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Professional document format, perfect for standard printers and archiving.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('pdf')}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={!labelUrls?.pdf && !labelUrl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </Card>

              <Card className="p-6 text-center hover:border-green-300 transition-colors border-2">
                <FileImage className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h4 className="font-medium mb-2 text-lg">PNG Format</h4>
                <p className="text-sm text-gray-500 mb-4">
                  High-quality image format, ideal for standard printers and digital use.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('png')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!labelUrls?.png}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
              </Card>

              <Card className="p-6 text-center hover:border-purple-300 transition-colors border-2">
                <FileArchive className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h4 className="font-medium mb-2 text-lg">ZPL Format</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Zebra Programming Language for thermal label printers.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('zpl')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!labelUrls?.zpl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download ZPL
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Send Label via Email</h3>
            
            <Card className="p-6 max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-address">Email Address</Label>
                  <Input
                    id="email-address"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-format">Format</Label>
                  <select
                    id="email-format"
                    value={selectedEmailFormat}
                    onChange={(e) => setSelectedEmailFormat(e.target.value as 'pdf' | 'png' | 'zpl')}
                    className="w-full p-2 border rounded-md mt-1"
                  >
                    <option value="pdf">PDF (Recommended)</option>
                    <option value="png">PNG Image</option>
                    <option value="zpl">ZPL for Thermal Printers</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailAddress}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPrintPreview;
