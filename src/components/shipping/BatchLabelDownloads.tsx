
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Mail, FileText, File, FileArchive, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BatchLabelDownloadsProps {
  batchUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
  };
  shipmentCount: number;
}

const BatchLabelDownloads: React.FC<BatchLabelDownloadsProps> = ({
  batchUrls,
  shipmentCount
}) => {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleBatchDownload = (format: 'pdf' | 'png' | 'zpl') => {
    const url = batchUrls[format];
    if (!url) {
      toast.error(`Batch ${format.toUpperCase()} file not available`);
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_labels_${shipmentCount}_shipments.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Batch ${format.toUpperCase()} file downloaded (${shipmentCount} labels)`);
  };

  const handleSendBatchEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    if (!batchUrls[selectedFormat]) {
      toast.error(`Batch ${selectedFormat.toUpperCase()} file not available`);
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Simulate email sending - in a real implementation, this would call a backend function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Batch labels sent to ${emailAddress} in ${selectedFormat.toUpperCase()} format`);
      setShowEmailDialog(false);
      setEmailAddress('');
    } catch (error) {
      toast.error('Failed to send batch email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center mb-4">
        <Package className="h-6 w-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-lg font-semibold text-blue-800">Download All Labels As</h3>
          <p className="text-blue-600 text-sm">{shipmentCount} labels ready for batch download</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Button
          onClick={() => handleBatchDownload('pdf')}
          disabled={!batchUrls.pdf}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          PDF Batch
        </Button>
        
        <Button
          onClick={() => handleBatchDownload('png')}
          disabled={!batchUrls.png}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <File className="h-4 w-4" />
          PNG Batch
        </Button>
        
        <Button
          onClick={() => handleBatchDownload('zpl')}
          disabled={!batchUrls.zpl}
          className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
        >
          <FileArchive className="h-4 w-4" />
          ZPL Batch
        </Button>
        
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Batch Labels to Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="batch-email">Email Address</Label>
                <Input
                  id="batch-email"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="batch-format">Batch Format</Label>
                <select
                  id="batch-format"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'png' | 'zpl')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="pdf">PDF Batch ({shipmentCount} labels)</option>
                  <option value="png">PNG Batch ({shipmentCount} labels)</option>
                  <option value="zpl">ZPL Batch ({shipmentCount} labels)</option>
                </select>
              </div>
              
              <Button 
                onClick={handleSendBatchEmail}
                disabled={isSendingEmail || !emailAddress}
                className="w-full"
              >
                {isSendingEmail ? 'Sending...' : `Send Batch (${shipmentCount} labels)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
        <strong>Note:</strong> Batch files contain all {shipmentCount} labels in a single consolidated file for efficient printing and processing.
      </div>
    </Card>
  );
};

export default BatchLabelDownloads;
