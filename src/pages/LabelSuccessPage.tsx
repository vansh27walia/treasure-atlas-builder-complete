
import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ShippingLabel from '@/components/shipping/ShippingLabel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck } from 'lucide-react';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [format, setFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    
    const urlFromParams = queryParams.get('labelUrl');
    const trackingFromParams = queryParams.get('trackingCode');
    const shipmentIdFromParams = queryParams.get('shipmentId');
    const formatFromParams = queryParams.get('format') as 'pdf' | 'png' | 'zpl' || 'pdf';
    
    console.log('Label success page params:', {
      labelUrl: urlFromParams,
      trackingCode: trackingFromParams,
      shipmentId: shipmentIdFromParams,
      format: formatFromParams
    });
    
    if (urlFromParams) {
      setLabelUrl(urlFromParams);
    }
    
    if (trackingFromParams) {
      setTrackingCode(trackingFromParams);
    }
    
    if (shipmentIdFromParams) {
      setShipmentId(shipmentIdFromParams);
    }
    
    if (formatFromParams && ['pdf', 'png', 'zpl'].includes(formatFromParams)) {
      setFormat(formatFromParams as 'pdf' | 'png' | 'zpl');
    }
    
    // If we don't have a label URL, redirect back to create label
    if (!urlFromParams) {
      console.error("No label URL provided in query parameters");
      setTimeout(() => navigate('/create-label', { replace: true }), 1000);
    }
  }, [location, navigate]);

  const handleCreateNewLabel = () => {
    navigate('/create-label', { replace: true });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <h1 className="text-2xl font-bold text-center text-green-800 flex items-center">
          <Truck className="mr-2 h-6 w-6 text-green-700" />
          Shipping Label Created
        </h1>
        
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>
      
      <Card className="p-6 border-2 border-green-100 shadow-sm bg-white rounded-lg mb-8">
        <div className="flex flex-col space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Your shipping label has been created!</h2>
            <p className="text-gray-600">
              You can download, print, or share your label using the options below.
            </p>
          </div>
          
          {labelUrl && (
            <ShippingLabel 
              labelUrl={labelUrl} 
              trackingCode={trackingCode} 
              shipmentId={shipmentId}
              format={format} 
            />
          )}
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
            <Button 
              variant="outline" 
              className="border-gray-300"
              onClick={handleCreateNewLabel}
            >
              Create Another Label
            </Button>
            
            <Link to="/dashboard">
              <Button>View All Shipments</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LabelSuccessPage;
