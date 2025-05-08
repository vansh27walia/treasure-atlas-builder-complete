
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const labelUrlParam = params.get('labelUrl');
    const trackingCodeParam = params.get('trackingCode');
    const shipmentIdParam = params.get('shipmentId');

    if (labelUrlParam) {
      setLabelUrl(decodeURIComponent(labelUrlParam));
    }

    if (trackingCodeParam) {
      setTrackingCode(decodeURIComponent(trackingCodeParam));
    }
    
    if (shipmentIdParam) {
      setShipmentId(decodeURIComponent(shipmentIdParam));
    }

    // Show success toast
    toast.success('Payment successful! Your shipping label is ready.');
  }, [location]);
  
  const handleViewTracking = () => {
    // Navigate to the tracking dashboard with the tracking code as a query parameter
    navigate(`/dashboard?tab=tracking&tracking=${trackingCode || ''}`);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Card className="p-8 text-center border-2 border-green-200">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your shipping label has been generated successfully.
          {trackingCode && ` Tracking number: ${trackingCode}`}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          {labelUrl && (
            <Button className="flex items-center gap-2" asChild>
              <a href={labelUrl} target="_blank" rel="noopener noreferrer" download="shipping-label.pdf">
                <Download className="h-5 w-5" />
                Download Label
              </a>
            </Button>
          )}

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleViewTracking}
          >
            <Truck className="h-5 w-5" />
            View Tracking
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/')}
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-left">
          <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Print your label and affix it to your package</li>
            <li>• Drop off your package at any authorized shipping location</li>
            <li>• Track your shipment through our tracking dashboard</li>
            <li>• Receive delivery notifications automatically</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default LabelSuccessPage;
