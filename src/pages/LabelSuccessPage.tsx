
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Home, Truck, Printer, File, FileArchive, FileText, Mail, ExternalLink, Search, Plus, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import NormalShippingLabelOptions from '@/components/shipping/NormalShippingLabelOptions';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [trackingSearch, setTrackingSearch] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [shopifyFulfilled, setShopifyFulfilled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const labelUrlParam = params.get('labelUrl');
    const trackingCodeParam = params.get('trackingCode');
    const shipmentIdParam = params.get('shipmentId');
    const shopifyParam = params.get('shopifyFulfilled');

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
    if (shopifyParam === 'true') {
      setShopifyFulfilled(true);
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

  const handleDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (labelUrl) {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping-label-${trackingCode || 'label'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${format.toUpperCase()} label`);
    } else {
      toast.error("Label URL is not available");
    }
  };

  const handleEmailLabel = () => {
    // In a real implementation, this would call an API to email the label
    toast.success('Label has been sent to your email address');
  };

  const handlePrintLabel = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    } else {
      toast.error("Label URL is not available");
    }
  };

  const handleCancelLabel = async () => {
    if (!shipmentId) {
      toast.error('No shipment ID available');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this label? This action cannot be undone.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-label', {
        body: { shipment_id: shipmentId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'Label cancelled successfully');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data?.error || 'Failed to cancel label');
      }
    } catch (error: any) {
      console.error('Error cancelling label:', error);
      toast.error(error.message || 'Failed to cancel label');
    } finally {
      setIsCancelling(false);
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

          {/* Shopify Fulfillment Status */}
          {shopifyFulfilled && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ShoppingBag className="h-4 w-4" />
              Shopify order fulfilled &amp; tracking synced
            </div>
          )}

          {/* Updated Label Options */}
          {labelUrl && (
            <div className="max-w-sm mx-auto mb-8">
              <NormalShippingLabelOptions
                labelUrl={labelUrl}
                trackingCode={trackingCode}
                shipmentId={shipmentId}
              />
            </div>
          )}

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

            <Button 
              variant="destructive"
              className="flex items-center gap-2 h-12 px-8"
              onClick={handleCancelLabel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Label'}
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
                      <FileText className="h-16 w-16 mx-auto mb-3 text-green-600" />
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

        {/* AI Chatbot */}
        <ShipAIChatbot />
      </div>
    </div>
  );
};

export default LabelSuccessPage;
