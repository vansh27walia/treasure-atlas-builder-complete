import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Eye, Printer, Search, Mail, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

// Label format options for print preview
const labelFormats = [
  { value: '8.5x11-left', label: '8.5x11" - 1 Shipping Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Shipping Labels per Page', description: 'Two 4x6" labels per letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Shipping Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' }
];

// Download format options
const downloadFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'epl', label: 'EPL' },
  { value: 'zpl', label: 'ZPL' }
];

const LabelSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Print Preview Modal states
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [selectedPreviewFormat, setSelectedPreviewFormat] = useState<string>('4x6');
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  
  // Email Modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [selectedEmailFormat, setSelectedEmailFormat] = useState<string>('pdf');
  
  // Download format selection
  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<string>('pdf');
  
  const [trackingSearch, setTrackingSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const labelUrlParam = params.get('labelUrl');
    const trackingCodeParam = params.get('trackingCode');
    const shipmentIdParam = params.get('shipmentId');

    if (labelUrlParam) {
      setLabelUrl(decodeURIComponent(labelUrlParam));
      setCurrentPreviewUrl(decodeURIComponent(labelUrlParam));
    }
    if (trackingCodeParam) {
      setTrackingCode(decodeURIComponent(trackingCodeParam));
      setTrackingSearch(decodeURIComponent(trackingCodeParam));
      setEmailSubject(`Shipping Label - Tracking: ${decodeURIComponent(trackingCodeParam)}`);
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

  // Open print preview modal
  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  // Handle direct download with selected format
  const handlePrintLabel = async () => {
    if (!shipmentId) {
      toast.error("Shipment ID is not available");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          label_format: selectedDownloadFormat,
          file_format: selectedDownloadFormat 
        }
      });

      if (error) throw error;

      if (data?.labelUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = data.labelUrl;
        link.download = `shipping-label-${trackingCode || shipmentId}.${selectedDownloadFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Label downloaded as ${selectedDownloadFormat.toUpperCase()}`);
      } else {
        toast.error("Label URL is not available");
      }
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error("Failed to download label");
    }
  };

  // Handle email modal
  const handleEmailLabel = () => {
    setIsEmailModalOpen(true);
  };

  // Handle format change in print preview modal
  const handlePreviewFormatChange = async (format: string) => {
    setSelectedPreviewFormat(format);
    
    if (!shipmentId) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          label_format: format,
          file_format: 'pdf' 
        }
      });

      if (error) throw error;

      if (data?.labelUrl) {
        setCurrentPreviewUrl(data.labelUrl);
        toast.success(`Preview updated to ${labelFormats.find(f => f.value === format)?.label}`);
      }
    } catch (error) {
      console.error('Error updating preview:', error);
      toast.error("Failed to update preview");
    }
  };

  // Handle download from print preview modal
  const handleDownloadFromPreview = () => {
    if (currentPreviewUrl) {
      const link = document.createElement('a');
      link.href = currentPreviewUrl;
      link.download = `shipping-label-${trackingCode || shipmentId}-${selectedPreviewFormat}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Label downloaded from preview');
      setIsPrintPreviewOpen(false);
    } else {
      toast.error("Preview URL is not available");
    }
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!shipmentId) {
      toast.error("Shipment ID is not available");
      return;
    }

    try {
      // Get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('User email not found');
        return;
      }

      // Get label in selected format
      const { data: labelData, error: labelError } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          label_format: selectedEmailFormat,
          file_format: selectedEmailFormat 
        }
      });

      if (labelError) throw labelError;

      // Send email with label
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          toEmails: [user.email],
          subject: emailSubject,
          description: `Your shipping label is attached in ${selectedEmailFormat.toUpperCase()} format.`,
          batchResult: {
            consolidatedLabelUrls: {
              [selectedEmailFormat]: labelData?.labelUrl
            }
          },
          selectedFormats: [selectedEmailFormat]
        }
      });

      if (error) throw error;

      toast.success(`Email sent successfully to ${user.email}`);
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Failed to send email");
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

          {/* Download Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Format:</label>
            <Select value={selectedDownloadFormat} onValueChange={setSelectedDownloadFormat}>
              <SelectTrigger className="w-full max-w-xs mx-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {downloadFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
            <Button 
              onClick={handlePrintPreview}
              className="bg-blue-600 hover:bg-blue-700 text-white h-16 text-lg font-semibold"
            >
              <Eye className="mr-3 h-6 w-6" /> 
              Print Preview
            </Button>
            
            <Button 
              onClick={handlePrintLabel}
              className="bg-purple-600 hover:bg-purple-700 text-white h-16 text-lg font-semibold"
            >
              <Download className="mr-3 h-6 w-6" /> 
              Print Label
            </Button>

            <Button 
              onClick={handleEmailLabel}
              className="bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-semibold"
            >
              <Mail className="mr-3 h-6 w-6" /> 
              Email
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

          {/* Navigation Options */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-12 px-8"
              onClick={() => navigate('/dashboard?tab=tracking')}
            >
              View All Shipments
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-12 px-8 border-gray-300"
              onClick={() => navigate('/create-label')}
            >
              Create Another Label
            </Button>
          </div>

          {/* What's Next Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-left">
            <h3 className="font-semibold text-blue-800 mb-4 text-xl">What's Next?</h3>
            <ul className="text-blue-700 space-y-4">
              <li className="flex items-start">
                <Printer className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Print your label and attach it securely to your package</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Drop off your package at any authorized shipping location</span>
              </li>
              <li className="flex items-start">
                <Search className="h-6 w-6 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-lg">Track your shipment progress through our dashboard</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Print Preview Modal */}
        <Dialog open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
          <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-2xl">Print Preview</DialogTitle>
              {trackingCode && (
                <p className="text-gray-600">Tracking: {trackingCode}</p>
              )}
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Format Selection Dropdown */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">Label Format:</label>
                <Select value={selectedPreviewFormat} onValueChange={handlePreviewFormatChange}>
                  <SelectTrigger className="w-full h-14 text-left bg-white border-2 border-gray-200">
                    <SelectValue>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-xs font-bold">L</span>
                        </div>
                        <div>
                          <div className="font-medium text-base">
                            {labelFormats.find(f => f.value === selectedPreviewFormat)?.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {labelFormats.find(f => f.value === selectedPreviewFormat)?.description}
                          </div>
                        </div>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="h-16 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center space-x-3 w-full">
                          <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold">L</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{format.label}</div>
                            <div className="text-xs text-gray-500">{format.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PDF Preview Area */}
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[500px]">
                <div className="text-sm text-gray-600 mb-3">
                  Preview: {labelFormats.find(f => f.value === selectedPreviewFormat)?.description}
                </div>
                <div className="bg-white rounded border shadow-sm">
                  {currentPreviewUrl ? (
                    <iframe 
                      src={currentPreviewUrl} 
                      className="w-full h-[500px] border-0 rounded" 
                      title="Label Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                      <Printer className="h-16 w-16 mb-4" />
                      <p className="text-lg">Label preview not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDownloadFromPreview}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!currentPreviewUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="bg-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Email Label</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Email Subject */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Subject Line:</label>
                <Input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full"
                />
              </div>

              {/* Email Format Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Format:</label>
                <Select value={selectedEmailFormat} onValueChange={setSelectedEmailFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {downloadFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!emailSubject.trim()}
              >
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
