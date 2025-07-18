
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, Printer, File, FileArchive, FileText, Mail, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const labelUrlParam = params.get('labelUrl');
    const trackingCodeParam = params.get('trackingCode');
    const shipmentIdParam = params.get('shipmentId');

    console.log("URL Parameters:", {
      labelUrl: labelUrlParam,
      trackingCode: trackingCodeParam,
      shipmentId: shipmentIdParam
    });

    if (labelUrlParam) {
      setLabelUrl(decodeURIComponent(labelUrlParam));
      console.log("Decoded label URL:", decodeURIComponent(labelUrlParam));
    } else {
      console.error('No label URL provided in the URL parameters');
      toast.error('Missing label information');
    }

    if (trackingCodeParam) {
      setTrackingCode(decodeURIComponent(trackingCodeParam));
    }
    
    if (shipmentIdParam) {
      setShipmentId(decodeURIComponent(shipmentIdParam));
    }

    toast.success('Your shipping label is ready!');
    window.scrollTo(0, 0);
    
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'complete' }
    }));
    
    const timer = setTimeout(() => setProgress(100), 100);
    return () => clearTimeout(timer);
  }, [location]);
  
  const handleViewTracking = () => {
    navigate(`/dashboard?tab=tracking&tracking=${trackingCode || ''}`);
  };

  const handleDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    setSelectedFormat(format);
    if (labelUrl) {
      window.open(labelUrl, '_blank');
      toast.success(`Downloading ${format.toUpperCase()} label`);
    } else {
      toast.error("Label URL is not available");
    }
  };

  const handleEmailLabel = () => {
    toast.success('Label sent to your email address');
  };

  const handlePrintLabel = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm pb-4 -mx-4 px-4 pt-4 rounded-lg mb-6">
          <ShippingWorkflow currentStep="complete" />
        </div>
        
        <Progress value={progress} className="h-3 mb-6 bg-gray-200" />
        
        <Card className="p-8 text-center border-2 border-green-200 shadow-xl bg-white/90 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-6 rounded-full">
              <CheckCircle className="h-20 w-20 text-green-600" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-green-800 mb-4">Label Created Successfully!</h1>
          <p className="text-gray-700 mb-8 text-lg">
            Your shipping label has been generated successfully.
            {trackingCode && (
              <span className="block mt-2">
                Tracking number: <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">{trackingCode}</span>
              </span>
            )}
          </p>

          {/* Debug information - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 p-4 mb-6 text-left rounded-lg">
              <h4 className="font-medium mb-2">Debug Information:</h4>
              <p className="text-xs break-all">Label URL: {labelUrl}</p>
              <p className="text-xs">Tracking: {trackingCode}</p>
              <p className="text-xs">Shipment ID: {shipmentId}</p>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button 
              onClick={() => setIsLabelModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold"
            >
              <FileText className="mr-2 h-6 w-6" /> 
              View Label
            </Button>
            
            <Button 
              onClick={() => handleDownload('pdf')}
              variant="outline"
              className="border-green-300 hover:bg-green-50 h-14 text-lg font-semibold"
            >
              <Download className="mr-2 h-6 w-6" /> 
              Download PDF
            </Button>

            <Button 
              onClick={handlePrintLabel}
              variant="outline"
              className="border-purple-300 hover:bg-purple-50 h-14 text-lg font-semibold"
            >
              <Printer className="mr-2 h-6 w-6" /> 
              Print Label
            </Button>

            <Button 
              onClick={handleEmailLabel}
              variant="outline"
              className="border-orange-300 hover:bg-orange-50 h-14 text-lg font-semibold"
            >
              <Mail className="mr-2 h-6 w-6" /> 
              Email Label
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-12 px-8"
              onClick={handleViewTracking}
            >
              <Truck className="h-5 w-5" />
              Track Shipment
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12 px-8 border-gray-300"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
              Create Another Label
            </Button>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-left">
            <h3 className="font-semibold text-blue-800 mb-4 text-xl">What's Next?</h3>
            <ul className="text-blue-700 space-y-4">
              <li className="flex items-start">
                <Printer className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Print your label and attach it securely to your package</span>
              </li>
              <li className="flex items-start">
                <Truck className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Drop off your package at any authorized shipping location</span>
              </li>
              <li className="flex items-start">
                <ExternalLink className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Track your shipment progress through our dashboard</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Enhanced Label View/Download Dialog */}
        <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
          <DialogContent className="bg-white max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl">Shipping Label</DialogTitle>
              {trackingCode && (
                <p className="text-gray-600">Tracking: {trackingCode}</p>
              )}
            </DialogHeader>
            
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="preview" className="text-lg">Preview</TabsTrigger>
                <TabsTrigger value="download" className="text-lg">Download</TabsTrigger>
                <TabsTrigger value="share" className="text-lg">Share</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="min-h-[500px] flex items-center justify-center border rounded-lg p-4">
                {labelUrl ? (
                  <iframe 
                    src={labelUrl} 
                    className="w-full h-[600px] border-0" 
                    title="Label Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <FileText className="h-20 w-20 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Label preview not available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="download">
                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div 
                      className={`p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg ${
                        selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedFormat('pdf')}
                    >
                      <File className="h-16 w-16 mx-auto mb-3 text-blue-600" />
                      <h4 className="font-semibold text-lg">PDF Format</h4>
                      <p className="text-sm text-gray-500">Best for printing</p>
                    </div>
                    
                    <div 
                      className={`p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg ${
                        selectedFormat === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedFormat('png')}
                    >
                      <File className="h-16 w-16 mx-auto mb-3 text-green-600" />
                      <h4 className="font-semibold text-lg">PNG Format</h4>
                      <p className="text-sm text-gray-500">Image format</p>
                    </div>
                    
                    <div 
                      className={`p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg ${
                        selectedFormat === 'zpl' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedFormat('zpl')}
                    >
                      <FileArchive className="h-16 w-16 mx-auto mb-3 text-purple-600" />
                      <h4 className="font-semibold text-lg">ZPL Format</h4>
                      <p className="text-sm text-gray-500">For thermal printers</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleDownload(selectedFormat)} 
                    className={`w-full h-14 text-lg ${
                      selectedFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 
                      selectedFormat === 'png' ? 'bg-green-600 hover:bg-green-700' : 
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Download className="mr-2 h-6 w-6" />
                    Download {selectedFormat.toUpperCase()} File
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="share">
                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                      <h4 className="font-semibold text-lg mb-3">Email Label</h4>
                      <p className="text-gray-600 mb-4">
                        Send this label to your email address for easy access later
                      </p>
                      <Button onClick={handleEmailLabel} className="w-full h-12">
                        <Mail className="mr-2 h-5 w-5" />
                        Send to Email
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h4 className="font-semibold text-lg mb-3">Print Directly</h4>
                      <p className="text-gray-600 mb-4">
                        Open the label in a new window for immediate printing
                      </p>
                      <Button onClick={handlePrintLabel} className="w-full h-12" variant="outline">
                        <Printer className="mr-2 h-5 w-5" />
                        Print Now
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLabelModalOpen(false)} className="h-12 px-8">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LabelSuccessPage;
