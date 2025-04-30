
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Package, Truck, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const LabelSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  
  useEffect(() => {
    // Parse query parameters to get label URL and tracking code
    const params = new URLSearchParams(location.search);
    const labelUrlParam = params.get('labelUrl');
    const trackingCodeParam = params.get('trackingCode');
    
    if (labelUrlParam && trackingCodeParam) {
      setLabelUrl(labelUrlParam);
      setTrackingCode(trackingCodeParam);
      
      // Display success toast
      toast.success("Shipping label created successfully!");
    } else {
      toast.error("Missing label information");
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 container mx-auto px-4">
        <Card className="max-w-3xl mx-auto p-8 border-2 border-green-200">
          <div className="text-center mb-8">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800">Label Created Successfully!</h1>
            <p className="text-gray-600 mt-2">Your shipping label has been created and is ready to print</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-green-800">Tracking Information</h2>
            <div className="flex items-center">
              <Truck className="mr-2 text-green-600" />
              <span className="font-medium">Tracking Number:</span>
              <span className="ml-2 font-mono bg-white px-3 py-1 border rounded-md">{trackingCode}</span>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-700">
                You can track your package using the tracking number above. Your tracking information
                will also be available in your shipping dashboard.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {labelUrl && (
              <a 
                href={labelUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="mr-2 h-5 w-5" /> Download Label
              </a>
            )}
            
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex items-center"
            >
              View Tracking Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default LabelSuccessPage;
