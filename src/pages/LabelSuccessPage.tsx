
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Download, 
  Printer, 
  Eye, 
  Mail, 
  Copy, 
  ExternalLink,
  Package,
  Truck
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const LabelSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [emailAddress, setEmailAddress] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const labelUrl = searchParams.get('labelUrl');
  const trackingCode = searchParams.get('trackingCode');
  const shipmentId = searchParams.get('shipmentId');

  const copyTrackingNumber = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      toast.success('Tracking number copied to clipboard!');
    }
  };

  const downloadLabel = () => {
    if (labelUrl) {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping-label-${trackingCode || 'label'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Label downloaded successfully!');
    }
  };

  const printLabel = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Opening print dialog...');
    }
  };

  const sendEmailLabel = async () => {
    if (!emailAddress || !labelUrl) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsEmailSending(true);
    try {
      // Call email function - you'll need to implement this
      toast.success(`Label sent to ${emailAddress}`);
      setEmailAddress('');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  const openPrintPreview = () => {
    setShowPrintPreview(true);
  };

  if (!labelUrl || !trackingCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Label Information Missing
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't find your label information. Please try creating a new label.
          </p>
          <Button onClick={() => navigate('/create-label')}>
            Create New Label
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <Card className="p-8 text-center mb-8 bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CheckCircle className="h-20 w-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              Label Created Successfully! 🎉
            </h1>
            <p className="text-xl opacity-90">
              Your shipping label is ready for use
            </p>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tracking Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Tracking Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Tracking Number
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={trackingCode} 
                      readOnly 
                      className="font-mono text-lg font-bold bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTrackingNumber}
                      className="px-3"
                      title="Copy tracking number"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {shipmentId && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Shipment ID
                    </Label>
                    <Input 
                      value={shipmentId} 
                      readOnly 
                      className="mt-1 font-mono bg-gray-50"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                    ✅ Ready to Ship
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Label Actions */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Label Actions</h2>
              </div>

              <div className="space-y-4">
                {/* Print Preview Button */}
                <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={openPrintPreview}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 py-3"
                    >
                      <Eye className="h-5 w-5" />
                      Print Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Print Preview - Shipping Label</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <iframe 
                        src={labelUrl} 
                        className="w-full h-[600px] border rounded-lg"
                        title="Label Preview"
                      />
                      <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                          Close Preview
                        </Button>
                        <Button onClick={printLabel} className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          Print Label
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Print Button */}
                <Button 
                  onClick={printLabel}
                  variant="outline"
                  className="w-full flex items-center gap-2 py-3 border-2 border-blue-200 hover:bg-blue-50"
                >
                  <Printer className="h-5 w-5" />
                  Print Label
                </Button>

                {/* Download Button */}
                <Button 
                  onClick={downloadLabel}
                  variant="outline"
                  className="w-full flex items-center gap-2 py-3 border-2 border-green-200 hover:bg-green-50"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </Button>

                {/* Email Section */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Label
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendEmailLabel}
                      disabled={isEmailSending || !emailAddress}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {isEmailSending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/create-label')}
                className="flex items-center gap-2 py-3"
              >
                <Package className="h-5 w-5" />
                Create Another Label
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/tracking')}
                className="flex items-center gap-2 py-3"
              >
                <Truck className="h-5 w-5" />
                Track Shipments
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open(labelUrl, '_blank')}
                className="flex items-center gap-2 py-3"
              >
                <ExternalLink className="h-5 w-5" />
                View Label
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LabelSuccessPage;
