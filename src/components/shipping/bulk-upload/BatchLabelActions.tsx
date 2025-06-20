
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail, FileText } from 'lucide-react';
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
  
  console.log('BatchLabelActions render:', {
    hasResults: !!results,
    successfulLabels: successfulLabels.length,
    batchResult: results.batchResult,
    consolidatedUrls: results.batchResult?.consolidatedLabelUrls
  });

  const handleDownload = (format: string) => {
    let downloadUrl = '';
    
    // Try to get consolidated URLs first
    if (results.batchResult?.consolidatedLabelUrls) {
      switch (format) {
        case 'pdf':
          downloadUrl = results.batchResult.consolidatedLabelUrls.pdf || '';
          break;
        case 'png':
          downloadUrl = results.batchResult.consolidatedLabelUrls.png || '';
          break;
        case 'zpl':
          downloadUrl = results.batchResult.consolidatedLabelUrls.zpl || '';
          break;
      }
    }

    // Fallback to bulk URLs if consolidated URLs not available (only for PDF/PNG)
    if (!downloadUrl && (format === 'pdf' || format === 'png')) {
      switch (format) {
        case 'pdf':
          downloadUrl = results.bulk_label_pdf_url || '';
          break;
        case 'png':
          downloadUrl = results.bulk_label_png_url || '';
          break;
      }
    }

    console.log(`Attempting to download ${format}:`, downloadUrl);

    if (!downloadUrl) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    onDownloadSingleLabel(downloadUrl);
    toast.success(`Downloaded consolidated ${format.toUpperCase()} labels`);
  };

  const handlePrintPreview = () => {
    const pdfUrl = results.batchResult?.consolidatedLabelUrls?.pdf || results.bulk_label_pdf_url;
    
    if (!pdfUrl) {
      toast.error('No PDF available for preview');
      return;
    }
    
    console.log('Opening print preview with URL:', pdfUrl);
    setShowPrintPreview(true);
  };

  const handleEmailSubmit = async () => {
    if (!emailAddress.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-label-email', {
        body: {
          email: emailAddress,
          batchId: results.batchResult?.batchId || 'batch_' + Date.now(),
          format: emailFormat,
          type: 'batch'
        }
      });

      if (error) {
        throw error;
      }

      console.log('Email sent successfully:', data);
      setEmailDialogOpen(false);
      setEmailAddress('');
      toast.success(`Batch ${emailFormat.toUpperCase()} labels sent to ${emailAddress}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    }
  };

  if (!results || !successfulLabels.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No successful labels to display actions for</p>
      </div>
    );
  }

  const pdfUrl = results.batchResult?.consolidatedLabelUrls?.pdf || results.bulk_label_pdf_url;

  return (
    <div className="space-y-6">
      {/* Consolidated Actions Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-blue-900">
              Batch Labels Ready ({successfulLabels.length} labels)
            </h2>
            <p className="text-blue-700">
              Download, print, or email your consolidated shipping labels
            </p>
          </div>
        </div>

        {/* Main Download Actions - Large Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => handleDownload('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center h-16 text-lg"
            size="lg"
          >
            <Download className="mr-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-bold">Download PDF</div>
              <div className="text-sm opacity-90">Consolidated Labels</div>
            </div>
          </Button>

          <Button
            onClick={() => handleDownload('png')}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center h-16 text-lg"
            size="lg"
          >
            <Download className="mr-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-bold">Download PNG</div>
              <div className="text-sm opacity-90">Consolidated Labels</div>
            </div>
          </Button>

          <Button
            onClick={() => handleDownload('zpl')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-16 text-lg"
            size="lg"
          >
            <Download className="mr-3 h-6 w-6" />
            <div className="text-center">
              <div className="font-bold">Download ZPL</div>
              <div className="text-sm opacity-90">Consolidated Labels</div>
            </div>
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handlePrintPreview}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center px-8 py-3"
            size="lg"
            disabled={!pdfUrl}
          >
            <Printer className="mr-2 h-5 w-5" />
            Print Preview
          </Button>

          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center px-8 py-3"
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
      {pdfUrl && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={pdfUrl}
          trackingCode={null}
          isBatchPreview={true}
        />
      )}
    </div>
  );
};

export default BatchLabelActions;
