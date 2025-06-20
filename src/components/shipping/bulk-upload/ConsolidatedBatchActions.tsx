
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Mail, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BulkUploadResult } from '@/types/shipping';

interface ConsolidatedBatchActionsProps {
  results: BulkUploadResult;
  onDownloadConsolidated: (format: string) => void;
  onEmailAll: (emails: string[]) => void;
}

const ConsolidatedBatchActions: React.FC<ConsolidatedBatchActionsProps> = ({
  results,
  onDownloadConsolidated,
  onEmailAll
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState('');

  const handleConsolidatedDownload = (format: string) => {
    onDownloadConsolidated(format);
    toast.success(`Downloaded consolidated ${format.toUpperCase()} file`);
  };

  const handlePrintAll = () => {
    if (!results.batchResult?.consolidatedLabelUrls?.pdf) {
      toast.error('No consolidated PDF available for printing');
      return;
    }
    setShowPrintPreview(true);
  };

  const handleEmailAll = () => {
    const emails = emailAddresses
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    if (emails.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }
    
    onEmailAll(emails);
    setEmailDialogOpen(false);
    setEmailAddresses('');
    toast.success(`Consolidated files sent to ${emails.length} email(s)`);
  };

  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];

  return (
    <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center mb-4">
        <FileText className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-blue-900">Consolidated Batch Actions</h2>
      </div>
      
      <p className="text-blue-700 mb-4">
        Download or manage all {successfulLabels.length} labels as consolidated files:
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {/* Consolidated Downloads */}
        <Button
          onClick={() => handleConsolidatedDownload('pdf')}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center h-16"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold">PDF</div>
            <div className="text-xs opacity-90">All Labels</div>
          </div>
        </Button>

        <Button
          onClick={() => handleConsolidatedDownload('png')}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center h-16"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold">PNG</div>
            <div className="text-xs opacity-90">All Labels</div>
          </div>
        </Button>

        <Button
          onClick={() => handleConsolidatedDownload('zpl')}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-16"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold">ZPL</div>
            <div className="text-xs opacity-90">All Labels</div>
          </div>
        </Button>

        <Button
          onClick={() => handleConsolidatedDownload('epl')}
          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center h-16"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold">EPL</div>
            <div className="text-xs opacity-90">All Labels</div>
          </div>
        </Button>

        {/* Print All */}
        <Button
          onClick={handlePrintAll}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center h-16"
          size="lg"
        >
          <PrinterIcon className="mr-2 h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold">Print All</div>
            <div className="text-xs opacity-90">Preview</div>
          </div>
        </Button>
      </div>

      {/* Email All Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            <Mail className="mr-2 h-5 w-5" />
            Send All to Email
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Consolidated Files to Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emails">Email Addresses (one per line)</Label>
              <Textarea
                id="emails"
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
                placeholder="email1@example.com&#10;email2@example.com"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEmailAll} className="flex-1">
                Send Files
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
      {results.batchResult && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl=""
          trackingCode={null}
          batchResult={results.batchResult}
          isBatchPreview={true}
        />
      )}
    </Card>
  );
};

export default ConsolidatedBatchActions;
