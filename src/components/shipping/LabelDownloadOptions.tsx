
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Printer, Mail, File, FileText, FileArchive } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface LabelDownloadOptionsProps {
  labelUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
  };
  labelType: 'individual' | 'batch';
  trackingNumber?: string;
  onPrintLabel: () => void;
}

const LabelDownloadOptions: React.FC<LabelDownloadOptionsProps> = ({
  labelUrls,
  labelType,
  trackingNumber,
  onPrintLabel
}) => {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDirectPdfDownload = () => {
    if (!labelUrls.pdf) {
      toast.error('PDF label not available');
      return;
    }
    
    const link = document.createElement('a');
    link.href = labelUrls.pdf;
    link.download = `${labelType}_label_${trackingNumber || Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('PDF label downloaded');
  };

  const handleFormatDownload = (format: 'pdf' | 'png' | 'zpl') => {
    const url = labelUrls[format];
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${labelType}_label_${trackingNumber || Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${format.toUpperCase()} label downloaded`);
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    if (!labelUrls[selectedFormat]) {
      toast.error(`${selectedFormat.toUpperCase()} format not available`);
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Simulate email sending - in a real implementation, this would call a backend function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Label sent to ${emailAddress} in ${selectedFormat.toUpperCase()} format`);
      setShowEmailDialog(false);
      setEmailAddress('');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleDirectPdfDownload}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          disabled={!labelUrls.pdf}
        >
          <Download className="h-4 w-4" />
          Download Label (PDF)
        </Button>
        
        <Button 
          onClick={onPrintLabel}
          variant="outline"
          className="flex items-center gap-2"
          disabled={!labelUrls.pdf}
        >
          <Printer className="h-4 w-4" />
          Print Label
        </Button>
      </div>

      {/* Download Format Options */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Download in:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFormatDownload('pdf')}
            disabled={!labelUrls.pdf}
            className="flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            PDF
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFormatDownload('png')}
            disabled={!labelUrls.png}
            className="flex items-center gap-1"
          >
            <File className="h-3 w-3" />
            PNG
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFormatDownload('zpl')}
            disabled={!labelUrls.zpl}
            className="flex items-center gap-1"
          >
            <FileArchive className="h-3 w-3" />
            ZPL
          </Button>
          
          <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Label to Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="format">Format</Label>
                  <select
                    id="format"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'png' | 'zpl')}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="pdf">PDF</option>
                    <option value="png">PNG</option>
                    <option value="zpl">ZPL</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailAddress}
                  className="w-full"
                >
                  {isSendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default LabelDownloadOptions;
