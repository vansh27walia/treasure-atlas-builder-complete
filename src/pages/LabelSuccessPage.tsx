
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, FileText, Mail, ExternalLink, Search, Eye } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import EnhancedLabelPreviewModal from '@/components/shipping/EnhancedLabelPreviewModal';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState('');

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
      setTrackingSearch(decodeURIComponent(trackingCodeParam));
    }
    if (shipmentIdParam) {
      setShipmentId(decodeURIComponent(shipmentIdParam));
    }

    toast.success('Your shipping label is ready!');
    window.scrollTo(0, 0);
    
    const timer = setTimeout(() => setProgress(100), 100);
    return () => clearTimeout(timer);
  }, [location]);

  const handleTrackingSearch = () => {
    if (trackingSearch.trim()) {
      navigate(`/tracking?search=${encodeURIComponent(trackingSearch.trim())}`);
    } else {
      toast.error('Please enter a tracking number');
    }
  };

  const handleDirectDownload = async () => {
    if (!labelUrl) {
      toast.error("Label URL is not available");
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping-label-${trackingCode || shipmentId || Date.now()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded PDF format label');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error("Failed to download label. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-3 bg-gray-200" />
        </div>

        {/* Success Card */}
        <Card className="p-8 text-center border-2 border-green-200 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
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

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button 
              onClick={() => setIsPreviewModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-semibold"
            >
              <Eye className="mr-2 h-6 w-6" /> 
              Print Preview
            </Button>
            
            <Button 
              onClick={handleDirectDownload}
              variant="outline"
              className="border-green-300 hover:bg-green-50 h-14 text-lg font-semibold"
            >
              <Download className="mr-2 h-6 w-6" /> 
              Quick Download
            </Button>

            <Button 
              onClick={() => setIsPreviewModalOpen(true)}
              variant="outline"
              className="border-orange-300 hover:bg-orange-50 h-14 text-lg font-semibold"
            >
              <Mail className="mr-2 h-6 w-6" /> 
              Email Options
            </Button>
          </div>

          {/* Tracking Search Bar */}
          <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Track Your Shipment</h3>
            <div className="flex gap-3 max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Enter tracking number..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrackingSearch()}
                className="flex-1"
              />
              <Button onClick={handleTrackingSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Track
              </Button>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-12 px-8"
              onClick={() => navigate('/dashboard?tab=tracking')}
            >
              <Truck className="h-5 w-5" />
              View All Shipments
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12 px-8 border-gray-300"
              onClick={() => navigate('/create-label')}
            >
              <Home className="h-5 w-5" />
              Create Another Label
            </Button>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-left">
            <h3 className="font-semibold text-blue-800 mb-4 text-xl">What's Next?</h3>
            <ul className="text-blue-700 space-y-4">
              <li className="flex items-start">
                <FileText className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Download your preferred label format and print it</span>
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

        {/* Enhanced Label Preview Modal */}
        <EnhancedLabelPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          labelUrl={labelUrl}
          trackingCode={trackingCode}
        />
      </div>
    </div>
  );
};

export default LabelSuccessPage;
