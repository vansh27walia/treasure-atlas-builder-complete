
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Mail } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IndividualLabelActionsProps {
  shipment: {
    id: string;
    label_url?: string;
    tracking_code?: string;
    customer_name?: string;
    customer_address?: any;
  };
  onDownload: (url: string, format: string) => void;
  onEmail: (email: string, shipmentId: string) => void;
}

const IndividualLabelActions: React.FC<IndividualLabelActionsProps> = ({
  shipment,
  onDownload,
  onEmail
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const handleDownload = (format: string) => {
    if (!shipment.label_url) {
      toast.error('No label available for download');
      return;
    }
    onDownload(shipment.label_url, format);
    toast.success(`Downloaded ${format.toUpperCase()} label`);
  };

  const handlePrintPreview = () => {
    if (!shipment.label_url) {
      toast.error('No label available for preview');
      return;
    }
    setShowPrintPreview(true);
  };

  const handleEmailSubmit = () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    onEmail(emailAddress, shipment.id);
    setEmailDialogOpen(false);
    setEmailAddress('');
    toast.success('Label sent to email');
  };

  const getCustomerEmail = () => {
    if (typeof shipment.customer_address === 'object' && shipment.customer_address?.email) {
      return shipment.customer_address.email;
    }
    return '';
  };

  React.useEffect(() => {
    if (emailDialogOpen) {
      const customerEmail = getCustomerEmail();
      if (customerEmail) {
        setEmailAddress(customerEmail);
      }
    }
  }, [emailDialogOpen]);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Download Options */}
      <div className="flex gap-1">
        <Button
          onClick={() => handleDownload('pdf')}
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <Download className="mr-1 h-3 w-3" />
          PDF
        </Button>
        
        <Button
          onClick={() => handleDownload('png')}
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50"
        >
          <Download className="mr-1 h-3 w-3" />
          PNG
        </Button>
        
        <Button
          onClick={() => handleDownload('zpl')}
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <Download className="mr-1 h-3 w-3" />
          ZPL
        </Button>
      </div>

      {/* Print Preview */}
      <Button
        onClick={handlePrintPreview}
        size="sm"
        variant="outline"
        className="text-purple-600 border-purple-600 hover:bg-purple-50"
      >
        <PrinterIcon className="mr-1 h-3 w-3" />
        Preview
      </Button>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <Mail className="mr-1 h-3 w-3" />
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
            <div className="flex gap-2">
              <Button onClick={handleEmailSubmit} className="flex-1">
                Send Label
              </Button>
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Modal */}
      {shipment.label_url && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={shipment.label_url}
          trackingCode={shipment.tracking_code || null}
          isBatchPreview={false}
        />
      )}
    </div>
  );
};

export default IndividualLabelActions;
