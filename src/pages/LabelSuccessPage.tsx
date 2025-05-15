
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, Printer } from 'lucide-react';
import { toast } from 'sonner';
import ShippingLabel from '@/components/shipping/ShippingLabel';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import { Progress } from '@/components/ui/progress';

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
      console.log("Decoded label URL:", decodeURIComponent(labelUrlParam));
    } else {
      console.error('No label URL provided in the URL parameters');
      toast("Missing label information");
    }

    if (trackingCodeParam) {
      setTrackingCode(decodeURIComponent(trackingCodeParam));
    }
    
    if (shipmentIdParam) {
      setShipmentId(decodeURIComponent(shipmentIdParam));
    }

    // Show success toast
    toast("Your shipping label is ready!");
    
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
    </div>
  );
};

export default LabelSuccessPage;
