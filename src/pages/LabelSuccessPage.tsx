
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, FileText, Mail, ExternalLink, Search, Eye } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

// Label format options
const LABEL_FORMATS = [
  {
    id: '4x6',
    name: '4x6" Shipping Label',
    description: 'For Thermal Label Printers',
    icon: '📄'
  },
  {
    id: '8.5x11-top',
    name: '8.5x11" - 1 Shipping Label (Top Half)',
    description: 'One label centered on top half of page',
    icon: '📋'
  },
  {
    id: '8.5x11-left',
    name: '8.5x11" - 1 Shipping Label (Left Side)',
    description: 'One label on the left side of page',
    icon: '📄'
  },
  {
    id: '8.5x11-two',
    name: '8.5x11" - 2 Shipping Labels per Page',
    description: 'Two labels on one page',
    icon: '📋'
  }
];

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Your Shipping Label');

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

  const handleDownloadLabel = async (format: string = selectedFormat) => {
    if (!shipmentId) {
      toast.error("Shipment ID is not available");
      return;
    }

    setIsDownloading(true);
    
    try {
      console.log(`Downloading label in ${format} format`);
      
      // Call the generate-label-format function
      const { data, error } = await supabase.functions.invoke('generate-label-format', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Error generating label:', error);
        throw new Error(`Error generating label: ${error.message}`);
      }

      // Create download URL and trigger download
      const url = `${supabase.supabaseUrl}/functions/v1/generate-label-format?format=${format}&shipmentId=${shipmentId}`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping-label-${format}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${format} format label`);
      
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error("Failed to download label. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailLabel = async () => {
    if (!trackingCode) {
      toast.error("Tracking code is not available");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          trackingCode,
          subject: emailSubject,
          format: selectedFormat
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsEmailModalOpen(false);
      toast.success('Label has been sent to your email address');
    } catch (error) {
      console.error('Error emailing label:', error);
      toast.error("Failed to email label. Please try again.");
    }
  };

  const getPreviewUrl = (format: string) => {
    return `${supabase.supabaseUrl}/functions/v1/generate-label-preview?format=${format}`;
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
              Preview Labels
            </Button>
            
            <Button 
              onClick={() => handleDownloadLabel('4x6')}
              variant="outline"
              className="border-green-300 hover:bg-green-50 h-14 text-lg font-semibold"
              disabled={isDownloading}
            >
              <Download className="mr-2 h-6 w-6" /> 
              {isDownloading ? 'Downloading...' : 'Download Label'}
            </Button>

            <Button 
              onClick={() => setIsEmailModalOpen(true)}
              variant="outline"
              className="border-orange-300 hover:bg-orange-50 h-14 text-lg font-semibold"
            >
              <Mail className="mr-2 h-6 w-6" /> 
              Email Label
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
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="bg-white max-w-7xl max-h-[95vh] overflow-hidden p-0">
            <div className="flex h-[90vh]">
              {/* Left Sidebar - Format Options */}
              <div className="w-80 bg-gray-50 border-r overflow-y-auto">
                <div className="p-6 border-b bg-white">
                  <DialogTitle className="text-xl font-semibold">Label Formats</DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">Choose your preferred format</p>
                </div>
                
                <div className="p-4 space-y-2">
                  {LABEL_FORMATS.map((format) => (
                    <div
                      key={format.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{format.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{format.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Preview Area */}
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b bg-white">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  <p className="text-sm text-gray-600">
                    {LABEL_FORMATS.find(f => f.id === selectedFormat)?.name}
                  </p>
                </div>

                {/* Preview Container */}
                <div className="flex-1 p-6 bg-gray-100 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-lg max-w-full max-h-full overflow-auto">
                    <img
                      src={getPreviewUrl(selectedFormat)}
                      alt={`Preview of ${selectedFormat} format`}
                      className="max-w-full h-auto"
                      style={{ maxHeight: '70vh' }}
                    />
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="p-6 bg-white border-t">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setIsPreviewModalOpen(false)}
                      className="px-6"
                    >
                      Close
                    </Button>
                    
                    <Button
                      onClick={() => handleDownloadLabel(selectedFormat)}
                      disabled={isDownloading}
                      className="bg-green-600 hover:bg-green-700 px-8"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloading ? 'Downloading...' : 'Download Label'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Label Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Email Your Label</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LABEL_FORMATS.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <Input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Your Shipping Label"
                  className="w-full"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmailLabel} className="bg-blue-600 hover:bg-blue-700">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LabelSuccessPage;
