
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Home, Truck, Download, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import { Progress } from '@/components/ui/progress';
import PrintPreview from '@/components/shipping/PrintPreview';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

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

  const handleDownloadLabel = () => {
    if (!labelUrl) {
      toast.error('No label available for download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `shipping_label_${trackingCode || Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Label downloaded successfully');
  };

  // Mock label URLs for different formats
  const labelUrls = {
    pdf: labelUrl || undefined,
    png: labelUrl ? labelUrl.replace('.pdf', '.png') : undefined,
    zpl: labelUrl ? labelUrl.replace('.pdf', '.zpl') : undefined,
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
          Your shipping label has been generated and is ready for download.
          {trackingCode && <> Tracking number: <span className="font-semibold">{trackingCode}</span></>}
        </p>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Button 
            onClick={handleDownloadLabel}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 h-12 px-8"
            disabled={!labelUrl}
          >
            <Download className="h-5 w-5" />
            Download Label
          </Button>
          
          <PrintPreview
            labelUrl={labelUrl || ''}
            trackingCode={trackingCode}
            shipmentId={shipmentId || undefined}
            labelUrls={labelUrls}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
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
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Print your label and affix it securely to your package</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Drop off your package at any authorized shipping location</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Track your shipment through our tracking dashboard</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default LabelSuccessPage;
