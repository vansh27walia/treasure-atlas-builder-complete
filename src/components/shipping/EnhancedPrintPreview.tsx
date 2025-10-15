import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X, Eye, File, FileImage, FileText, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import EmailLabelsModal from './EmailLabelsModal';

interface EnhancedPrintPreviewProps {
  triggerButton?: React.ReactNode;
  isOpenProp?: boolean;
  onOpenChangeProp?: (open: boolean) => void;
  labelUrl: string;
  trackingCode: string | null;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  shipmentId?: string;
}

const EnhancedPrintPreview: React.FC<EnhancedPrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentDetails,
  shipmentId
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChangeProp) {
      onOpenChangeProp(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [activeTab, setActiveTab] = useState('preview');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (!labelUrl) {
      toast.error('No label data available');
      return;
    }

    try {
      toast.loading(`Preparing ${format.toUpperCase()} download...`);
      
      let blob: Blob;
      let filename: string;
      
      // ALWAYS download the original file without modifications
      const response = await fetch(labelUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch label: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      if (format === 'pdf') {
        blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
      } else if (format === 'png') {
        blob = new Blob([arrayBuffer], { type: 'image/png' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.png`;
      } else {
        blob = new Blob([arrayBuffer], { type: 'text/plain' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.zpl`;
      }
      
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      
      toast.dismiss();
      toast.success(`Downloaded ${format.toUpperCase()} label`);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.dismiss();
      toast.error('Failed to download label');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        toast.success('Print dialog opened');
      } catch (error) {
        console.error("Error printing PDF:", error);
        toast.error("Failed to open print dialog. Please try downloading and printing manually.");
      }
    } else {
      toast.error("Print preview not available");
    }
  };

  const handleEmailClick = () => {
    setShowEmailModal(true);
  };

  const dialogTitleText = `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={() => handleDownload('pdf')}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
              <Eye className="h-3 w-3 mr-1" />
              Print Preview
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="max-w-6xl bg-white sm:rounded-lg max-h-[95vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col pt-4">
          {/* Tabs for Preview/Download */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
              <TabsTrigger value="preview" className="text-sm py-2">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="text-sm py-2">
                <Download className="h-4 w-4 mr-2" />
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col space-y-4">
              {/* PDF Preview - Smaller size to show button */}
              <div className="p-4 bg-gray-50 border rounded-lg">
                <div className="mx-auto bg-white p-3 shadow-lg rounded-lg">
                  {labelUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={labelUrl} 
                      style={{ 
                        width: '100%', 
                        height: '450px',
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }} 
                      title="Label Preview"
                    />
                  ) : (
                    <div className="border border-gray-300 h-96 flex items-center justify-center text-gray-500 rounded-lg">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Loading label preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Print Button - Only in Preview Tab */}
              <div className="pt-2">
                <Button
                  onClick={handlePrint}
                  disabled={!labelUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1">
              <div className="p-6 space-y-6">
                {/* Email Button at Top */}
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={handleEmailClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Label
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-blue-500 bg-blue-50 hover:bg-blue-100"
                    onClick={() => handleDownload('pdf')}
                  >
                    <File className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <h4 className="font-bold text-lg mb-2">PDF Format</h4>
                    <p className="text-sm text-gray-600 mb-4">Best for printing and archiving</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                
                  <div 
                    className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-green-500 bg-green-50 hover:bg-green-100"
                    onClick={() => handleDownload('png')}
                  >
                    <FileImage className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h4 className="font-bold text-lg mb-2">PNG Format</h4>
                    <p className="text-sm text-gray-600 mb-4">Image format for viewing</p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-10">
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                  </div>
                
                  <div 
                    className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-purple-500 bg-purple-50 hover:bg-purple-100"
                    onClick={() => handleDownload('zpl')}
                  >
                    <FileText className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                    <h4 className="font-bold text-lg mb-2">ZPL Format</h4>
                    <p className="text-sm text-gray-600 mb-4">For thermal printers</p>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-10">
                      <Download className="h-4 w-4 mr-2" />
                      Download ZPL
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailLabelsModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          batchResult={{
            batchId: shipmentId || 'single-label',
            consolidatedLabelUrls: {
              pdf: labelUrl,
              png: labelUrl,
              zpl: null
            },
            scanFormUrl: null
          }}
        />
      )}
    </Dialog>
  );
};

export default EnhancedPrintPreview;
