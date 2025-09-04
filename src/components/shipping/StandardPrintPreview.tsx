import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Printer, Download, FileText, FileArchive, Mail, X, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFDocument, rgb } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

interface StandardPrintPreviewProps {
  triggerButton?: React.ReactNode;
  isOpenProp?: boolean;
  onOpenChangeProp?: (open: boolean) => void;
  labelUrl: string;
  trackingCode: string | null;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
}

const StandardPrintPreview: React.FC<StandardPrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentId,
  labelUrls
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

  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert PNG to PDF for 8.5x11 display
  const convertPngToPdf = async (pngUrl: string): Promise<string> => {
    try {
      const response = await fetch(pngUrl);
      const pngBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // 8.5x11 inches in points
      
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const pngDims = pngImage.scale(1);
      
      // Scale to fit 8.5x11 while maintaining aspect ratio
      const maxWidth = 550;
      const maxHeight = 730;
      const scale = Math.min(maxWidth / pngDims.width, maxHeight / pngDims.height);
      
      const scaledWidth = pngDims.width * scale;
      const scaledHeight = pngDims.height * scale;
      
      // Center on page
      const x = (612 - scaledWidth) / 2;
      const y = (792 - scaledHeight) / 2;
      
      page.drawImage(pngImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting PNG to PDF:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const loadPreview = async () => {
        setIsLoading(true);
        try {
          // Use PNG URL if available, convert to PDF for display
          const pngUrl = labelUrls?.png || labelUrl;
          if (pngUrl && (pngUrl.includes('.png') || labelUrls?.png)) {
            const pdfUrl = await convertPngToPdf(pngUrl);
            setCurrentPreviewUrl(pdfUrl);
          } else {
            // Fallback to original URL if no PNG available
            setCurrentPreviewUrl(labelUrl);
          }
        } catch (error) {
          console.error('Error loading preview:', error);
          setCurrentPreviewUrl(labelUrl);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadPreview();
    }
  }, [isOpen, labelUrl, labelUrls]);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Unable to print. Please download and print manually.');
      }
    }
  };

  const handleDownload = async (format: 'pdf' | 'zpl' | 'epl') => {
    let downloadUrl: string | undefined;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'pdf':
        downloadUrl = currentPreviewUrl; // Use the converted PDF
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
        mimeType = 'application/pdf';
        break;
      case 'zpl':
        downloadUrl = labelUrls?.zpl;
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.zpl`;
        mimeType = 'text/plain';
        break;
      case 'epl':
        // Note: EPL might need to be generated separately or use ZPL as fallback
        downloadUrl = labelUrls?.zpl;
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.epl`;
        mimeType = 'text/plain';
        break;
    }

    if (!downloadUrl) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    try {
      toast.loading(`Downloading ${format.toUpperCase()} label...`);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      
      toast.success(`${format.toUpperCase()} label downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${format} label:`, error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setIsEmailLoading(true);
    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: {
          email: emailAddress,
          labelUrl: labelUrls?.pdf || labelUrl,
          trackingCode,
          isBatch: false
        }
      });

      if (error) throw error;

      toast.success('Label sent successfully!');
      setIsEmailModalOpen(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Print Preview - 8.5" x 11" Format
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Label Preview */}
          <div className="h-[500px] border rounded-lg mb-4 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading preview...</span>
              </div>
            ) : currentPreviewUrl ? (
              <iframe
                ref={iframeRef}
                src={currentPreviewUrl}
                className="w-full h-full border-0 rounded-lg"
                title="Label Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No preview available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Download Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Download Options</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => handleDownload('pdf')}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isLoading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleDownload('zpl')}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!labelUrls?.zpl}
                >
                  <FileArchive className="w-4 h-4 mr-2" />
                  Download ZPL
                </Button>
                <Button
                  onClick={() => handleDownload('epl')}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!labelUrls?.zpl}
                >
                  <FileArchive className="w-4 h-4 mr-2" />
                  Download EPL
                </Button>
              </div>
            </div>

            {/* Print & Email Options */}
            <div className="space-y-3">
              <h4 className="font-medium">Print & Share</h4>
              <div className="space-y-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isLoading}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Label
                </Button>
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Label
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Shipping Label
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleSendEmail}
                disabled={isEmailLoading || !emailAddress}
                className="flex-1"
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Label
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default StandardPrintPreview;