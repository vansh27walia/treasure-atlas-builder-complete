
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import { BulkUploadResult } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';

interface BatchLabelActionsProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string) => void;
}

const BatchLabelActions: React.FC<BatchLabelActionsProps> = ({
  results,
  onDownloadSingleLabel
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailFormat, setEmailFormat] = useState('pdf');

  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const batchPdfUrl = results.batchResult?.consolidatedLabelUrls?.pdf;

  const handleDownload = (format: string) => {
    let downloadUrl = '';
    
    switch (format) {
      case 'pdf':
        downloadUrl = results.batchResult?.consolidatedLabelUrls?.pdf || '';
        break;
      case 'png':
        downloadUrl = results.batchResult?.consolidatedLabelUrls?.png || '';
        break;
      case 'zpl':
        downloadUrl = results.batchResult?.consolidatedLabelUrls?.zpl || '';
        break;
      default:
        downloadUrl = batchPdfUrl || '';
    }

    if (!downloadUrl) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    onDownloadSingleLabel(downloadUrl);
    toast.success(`Downloaded ${format.toUpperCase()} labels`);
  };

  const handlePrintPreview = () => {
    if (!batchPdfUrl) {
      toast.error('No PDF available for preview');
      return;
    }
    setShowPrintPreview(true);
  };

  const handleEmailSubmit = async () => {
    if (!emailAddress.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-label-email', {
        body: {
          email: emailAddress,
          batchId: results.batchResult?.batchId,
          format: emailFormat,
          type: 'batch'
        }
      });

      if (error) {
        throw error;
      }

      setEmailDialogOpen(false);
      setEmailAddress('');
      toast.success(`Batch labels sent to ${emailAddress}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    }
  };

  if (!results || !successfulLabels.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Main Action Card - Like International Labels */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Batch Labels Ready ({successfulLabels.length} labels)
          </h2>
          <p className="text-blue-700">
            Download, print, or email your consolidated shipping labels
          </p>
        </div>

        {/* Download Options - Side by Side like International */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={() => handleDownload('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center px-6 py-3"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>

          <Button
            onClick={() => handleDownload('png')}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center px-6 py-3"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download PNG
          </Button>

          <Button
            onClick={() => handleDownload('zpl')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center px-6 py-3"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download ZPL
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handlePrintPreview}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center px-6 py-3"
            size="lg"
          >
            <Printer className="mr-2 h-5 w-5" />
            Print Preview
          </Button>

          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center px-6 py-3"
                size="lg"
              >
                <Mail className="mr-2 h-5 w-5" />
                Send to Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Batch Labels via Email</DialogTitle>
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
                  <Select value={emailFormat} onValueChange={setEmailFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="zpl">ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEmailSubmit} className="flex-1">
                    Send Labels
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
        </div>
      </Card>

      {/* Print Preview Modal */}
      {batchPdfUrl && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={batchPdfUrl}
          trackingCode={null}
          isBatchPreview={true}
        />
      )}
    </div>
  );
};

export default BatchLabelActions;
