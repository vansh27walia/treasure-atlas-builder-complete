import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, FileText, Mail, ExternalLink, Search, Eye, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

// Supabase URL constant
const SUPABASE_URL = "https://adhegezdzqlnqqnymvps.supabase.co";

// Label format options
const LABEL_FORMATS = [
  {
    id: '4x6',
    name: '4x6" Shipping Label',
    description: 'Formatted for Thermal Label Printers',
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
    name: '8.5x11" - 1 Shipping Label per Page - Left Side',
    description: 'One 4x6" label on the left side of a letter-sized page',
    icon: '📄'
  },
  {
    id: '8.5x11-two',
    name: '8.5x11" - 2 Shipping Labels per Page',
    description: 'Two labels on one page vertically',
    icon: '📋'
  }
];

const DOWNLOAD_FORMATS = [
  { id: 'pdf', name: 'PDF', description: 'Professional document format' },
  { id: 'png', name: 'PNG', description: 'High-quality image format' },
  { id: 'zpl', name: 'ZPL', description: 'Zebra Programming Language' }
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
  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<string>('pdf');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Your Shipping Label');
  const [emailFormat, setEmailFormat] = useState<string>('pdf');

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

  const handleDownloadLabel = async (format?: string) => {
    if (!labelUrl) {
      toast.error("Label URL is not available");
      return;
    }

    setIsDownloading(true);
    
    try {
      const downloadFormat = format || selectedDownloadFormat;
      console.log(`Downloading label in ${downloadFormat} format`);
      
      // For PDF format, use the original label URL if it's a PDF
      if (downloadFormat === 'pdf' && labelUrl.includes('.pdf')) {
        const link = document.createElement('a');
        link.href = labelUrl;
        link.download = `shipping-label-${trackingCode || shipmentId || Date.now()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded ${downloadFormat.toUpperCase()} format label`);
      } else {
        // For other formats, we would need backend support
        toast.info(`${downloadFormat.toUpperCase()} format download will be available soon`);
      }
      
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
          format: emailFormat
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
    return `${SUPABASE_URL}/functions/v1/generate-label-preview?format=${format}`;
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    console.log(`Format changed to: ${format}`);
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
              onClick={() => handleDownloadLabel('pdf')}
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
          <DialogContent className="bg-white max-w-6xl max-h-[95vh] overflow-hidden p-0">
            <div className="flex flex-col h-[90vh]">
              {/* Header with Format Dropdown */}
              <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-semibold mb-4">Label Preview & Download</DialogTitle>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Format:</label>
                      <select
                        value={selectedFormat}
                        onChange={(e) => handleFormatChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {LABEL_FORMATS.map((format) => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                      
                      <label className="text-sm font-medium text-gray-700 ml-6">Download Format:</label>
                      <select
                        value={selectedDownloadFormat}
                        onChange={(e) => setSelectedDownloadFormat(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {DOWNLOAD_FORMATS.map((format) => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview Container */}
              <div className="flex-1 p-6 bg-gray-100 flex items-center justify-center overflow-auto">
                <div className="bg-white rounded-lg shadow-lg max-w-full max-h-full overflow-auto">
                  {labelUrl ? (
                    <iframe
                      src={labelUrl}
                      className="w-full h-[600px] border-0"
                      title="Label Preview"
                    />
                  ) : (
                    <div className="w-96 h-96 flex items-center justify-center text-gray-500 border border-gray-300">
                      Preview not available
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="p-6 bg-white border-t flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-6"
                >
                  Close
                </Button>
                
                <Button
                  onClick={() => handleDownloadLabel()}
                  disabled={isDownloading}
                  className="bg-green-600 hover:bg-green-700 px-8"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? 'Downloading...' : `Download ${selectedDownloadFormat.toUpperCase()}`}
                </Button>
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
                  value={emailFormat}
                  onChange={(e) => setEmailFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DOWNLOAD_FORMATS.map((format) => (
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
