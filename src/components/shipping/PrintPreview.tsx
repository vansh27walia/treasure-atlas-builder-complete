
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Mail, FileText, FileImage, FileArchive, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PrintPreviewProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  onFormatChange?: (format: string) => Promise<void>;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  labelUrls,
  shipmentDetails,
  onFormatChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedEmailFormat, setSelectedEmailFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => {
      toast.success('Print dialog opened');
      setIsOpen(false);
    },
    content: () => contentRef.current,
  });

  const handleFormatDownload = (format: 'png' | 'pdf' | 'zpl') => {
    const url = labelUrls?.[format] || labelUrl;
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available for this label`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${format.toUpperCase()} label`);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download label");
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const labelToSend = labelUrls?.[selectedEmailFormat] || labelUrl;
    if (!labelToSend) {
      toast.error(`${selectedEmailFormat.toUpperCase()} format not available`);
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Simulate email sending API call
      const response = await fetch('/api/send-label-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          labelUrl: labelToSend,
          format: selectedEmailFormat,
          trackingNumber: trackingCode,
          shipmentId: shipmentId
        }),
      });

      if (response.ok) {
        toast.success(`Label sent to ${emailAddress} in ${selectedEmailFormat.toUpperCase()} format`);
        setEmailAddress('');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-12 px-8">
          <Printer className="h-5 w-5" />
          Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Print & Download Options</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="preview">Print Preview</TabsTrigger>
            <TabsTrigger value="formats">Download Formats</TabsTrigger>
            <TabsTrigger value="email">Send via Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-center mb-4">
              <Button 
                onClick={handlePrint} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Now
              </Button>
            </div>

            <div ref={contentRef} className="flex justify-center bg-white p-4">
              <div className="max-w-md">
                <img 
                  src={labelUrl} 
                  alt="Shipping Label" 
                  className="w-full border border-gray-300 rounded"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formats" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Download in Different Formats</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center hover:border-red-300 transition-colors">
                <FileText className="h-12 w-12 mx-auto mb-3 text-red-600" />
                <h4 className="font-medium mb-2">PDF Format</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Professional document format for printing and archiving.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('pdf')}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={!labelUrls?.pdf && !labelUrl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              <div className="border rounded-lg p-4 text-center hover:border-green-300 transition-colors">
                <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h4 className="font-medium mb-2">PNG Format</h4>
                <p className="text-xs text-gray-500 mb-4">
                  High-quality image format for standard printers.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('png')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!labelUrls?.png}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
              </div>

              <div className="border rounded-lg p-4 text-center hover:border-purple-300 transition-colors">
                <FileArchive className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h4 className="font-medium mb-2">ZPL Format</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Zebra Programming Language for thermal printers.
                </p>
                <Button 
                  onClick={() => handleFormatDownload('zpl')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!labelUrls?.zpl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download ZPL
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Send Label via Email</h3>
            
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email-format">Format</Label>
                <select
                  id="email-format"
                  value={selectedEmailFormat}
                  onChange={(e) => setSelectedEmailFormat(e.target.value as 'pdf' | 'png' | 'zpl')}
                  className="w-full p-2 border rounded-md mt-1"
                >
                  <option value="pdf">PDF</option>
                  <option value="png">PNG</option>
                  <option value="zpl">ZPL</option>
                </select>
              </div>
              
              <Button 
                onClick={handleSendEmail}
                disabled={isSendingEmail || !emailAddress}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;
