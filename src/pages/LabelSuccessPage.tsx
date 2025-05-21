import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, Printer, File, FileArchive, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import ShippingLabel from '@/components/shipping/ShippingLabel';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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

    // Show success toast
    toast.success('Your shipping label is ready!');
    
    // Scroll to top and prevent any unwanted scrolling
    window.scrollTo(0, 0);
    
    // Dispatch event to update workflow step
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'complete' }
    }));
    
    // Animate progress bar
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="sticky top-0 z-10 bg-white pb-4 -mx-4 px-4 pt-4">
        <ShippingWorkflow currentStep="complete" />
      </div>
      
      <Progress value={progress} className="h-2 mb-2 bg-gray-200" />
      
      <Card className="p-8 text-center border-2 border-green-200 mt-6 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-green-800 mb-2">Label Created Successfully!</h1>
        <p className="text-gray-600 mb-8">
          Your shipping label has been generated successfully.
          {trackingCode && <> Tracking number: <span className="font-semibold">{trackingCode}</span></>}
        </p>

        {/* Debug information - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 mb-6 text-left rounded">
            <h4 className="font-medium mb-2">Debug Information:</h4>
            <p className="text-xs break-all">Label URL: {labelUrl}</p>
            <p className="text-xs">Tracking: {trackingCode}</p>
            <p className="text-xs">Shipment ID: {shipmentId}</p>
          </div>
        )}

        {/* Label Generated Successfully Box */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border-2 border-green-200">
          <h3 className="font-semibold text-green-800 text-xl mb-2">Label Generated Successfully!</h3>
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="text-sm text-blue-800 mb-1">Tracking Number:</p>
            <p className="text-lg font-mono bg-white px-4 py-2 rounded border border-blue-200">{trackingCode}</p>
          </div>

          <h4 className="text-gray-700 font-medium mb-4 text-lg">How would you like to receive your label?</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsLabelModalOpen(true)}
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <FileText className="mr-2 h-5 w-5" /> View Label
            </Button>
            
            <Button 
              onClick={() => handleDownload('pdf')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 h-12"
            >
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Render the ShippingLabel component to handle downloads */}
        {labelUrl && (
          <ShippingLabel 
            labelUrl={labelUrl} 
            trackingCode={trackingCode} 
            shipmentId={shipmentId}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 mt-6">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 h-12"
            onClick={handleViewTracking}
          >
            <Truck className="h-5 w-5" />
            View Tracking
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-12 border-blue-200"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
        </div>

        <div className="bg-blue-50 p-6 rounded-md border border-blue-100 text-left">
          <h3 className="font-semibold text-blue-800 mb-3 text-lg">What's Next?</h3>
          <ul className="text-blue-700 space-y-3">
            <li className="flex items-start">
              <Printer className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              <span>Print your label and affix it to your package</span>
            </li>
            <li className="flex items-start">
              <Truck className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              <span>Drop off your package at any authorized shipping location</span>
            </li>
            <li className="flex items-start">
              <Download className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              <span>Track your shipment through our tracking dashboard</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Label View/Download Dialog */}
      <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="min-h-[400px] flex items-center justify-center border rounded-md p-4">
              {labelUrl ? (
                <iframe 
                  src={labelUrl} 
                  className="w-full h-[500px]" 
                  title="Label Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Label preview not available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="download">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                    onClick={() => setSelectedFormat('pdf')}
                  >
                    <File className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">PDF Format</h4>
                    <p className="text-xs text-gray-500">Best for printing</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}
                    `}
                    onClick={() => setSelectedFormat('png')}
                  >
                    <File className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">PNG Format</h4>
                    <p className="text-xs text-gray-500">Image format</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'zpl' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                    `}
                    onClick={() => setSelectedFormat('zpl')}
                  >
                    <FileArchive className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-medium">ZPL Format</h4>
                    <p className="text-xs text-gray-500">For thermal printers</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleDownload(selectedFormat)} 
                  className={`w-full h-12 ${
                    selectedFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 
                    selectedFormat === 'png' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download {selectedFormat.toUpperCase()} File
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabelSuccessPage;
