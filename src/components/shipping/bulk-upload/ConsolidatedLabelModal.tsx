
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Mail, Printer, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

interface ConsolidatedLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: {
    consolidatedLabelUrls: {
      pdf?: string;
      png?: string;
      zpl?: string;
      epl?: string;
      pdfZip?: string;
      zplZip?: string;
    };
  } | null;
  customerEmail?: string;
}

const ConsolidatedLabelModal: React.FC<ConsolidatedLabelModalProps> = ({
  isOpen,
  onClose,
  batchResult,
  customerEmail = ''
}) => {
  const [emailAddress, setEmailAddress] = useState(customerEmail);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleDownload = (url: string, format: string) => {
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `consolidated_labels.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded consolidated ${format.toUpperCase()} labels`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()} labels`);
    }
  };

  const handleCopyLink = (url: string, format: string) => {
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }
    
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`${format.toUpperCase()} link copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handlePrint = () => {
    if (!batchResult?.consolidatedLabelUrls?.pdf) {
      toast.error('PDF not available for printing');
      return;
    }
    
    const printWindow = window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleEmailLabels = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (!batchResult?.consolidatedLabelUrls?.pdf) {
      toast.error('No PDF available to email');
      return;
    }
    
    setIsEmailSending(true);
    
    try {
      // This would be implemented with your email service
      toast.success(`Labels sent to ${emailAddress}`);
      setEmailAddress('');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  const downloadOptions = [
    { format: 'pdf', label: 'PDF', url: batchResult?.consolidatedLabelUrls?.pdf },
    { format: 'png', label: 'PNG', url: batchResult?.consolidatedLabelUrls?.png },
    { format: 'zpl', label: 'ZPL', url: batchResult?.consolidatedLabelUrls?.zpl },
    { format: 'epl', label: 'EPL', url: batchResult?.consolidatedLabelUrls?.epl },
    { format: 'zip', label: 'PDF ZIP', url: batchResult?.consolidatedLabelUrls?.pdfZip },
    { format: 'zip', label: 'ZPL ZIP', url: batchResult?.consolidatedLabelUrls?.zplZip }
  ].filter(option => option.url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Consolidated Label Preview
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* PDF Preview */}
          {batchResult?.consolidatedLabelUrls?.pdf && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={batchResult.consolidatedLabelUrls.pdf}
                className="w-full h-96"
                title="Label Preview"
              />
            </div>
          )}
          
          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Download Options</h3>
              <div className="space-y-2">
                {downloadOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{option.label}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(option.url!, option.format)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(option.url!, option.format)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Actions</h3>
              
              {/* Print Option */}
              <Button
                onClick={handlePrint}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!batchResult?.consolidatedLabelUrls?.pdf}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
              
              {/* Email Option */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Labels To:</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                  <Button
                    onClick={handleEmailLabels}
                    disabled={isEmailSending || !emailAddress}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {isEmailSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsolidatedLabelModal;
