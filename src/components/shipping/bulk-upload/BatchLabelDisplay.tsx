
import React, { useState } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import BatchLabelHeader from './BatchLabelHeader';
import IndividualLabelCard from './IndividualLabelCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

interface BatchLabelDisplayProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string) => void;
}

const BatchLabelDisplay: React.FC<BatchLabelDisplayProps> = ({
  results,
  onDownloadSingleLabel
}) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddresses, setEmailAddresses] = useState('');
  const [emailFormat, setEmailFormat] = useState('pdf');

  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  const handleConsolidatedDownload = (format: string) => {
    const batchId = results.batchResult?.batchId;
    if (!batchId) {
      toast.error('No batch ID available');
      return;
    }
    
    // Generate consolidated label URL
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    const consolidatedUrl = `${baseUrl}/batch_label_${batchId}.${format}`;
    
    onDownloadSingleLabel(consolidatedUrl);
    toast.success(`Downloaded consolidated ${format.toUpperCase()} file`);
  };

  const handlePrintConsolidated = () => {
    const pdfUrl = results.batchResult?.consolidatedLabelUrls?.pdf;
    if (!pdfUrl) {
      toast.error('No consolidated PDF available');
      return;
    }
    
    window.open(pdfUrl, '_blank');
    toast.success('Opened consolidated PDF for printing');
  };

  const handleEmailConsolidated = () => {
    setEmailDialogOpen(true);
  };

  const handleEmailSubmit = () => {
    const emails = emailAddresses
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    if (emails.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }
    
    // Here you would call your email API
    console.log('Sending consolidated files to:', emails, 'Format:', emailFormat);
    
    setEmailDialogOpen(false);
    setEmailAddresses('');
    toast.success(`Consolidated files sent to ${emails.length} recipient(s)`);
  };

  const handleCopyConsolidatedLink = () => {
    const batchId = results.batchResult?.batchId;
    if (!batchId) {
      toast.error('No batch ID available');
      return;
    }
    
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    const consolidatedUrl = `${baseUrl}/batch_label_${batchId}.pdf`;
    
    navigator.clipboard.writeText(consolidatedUrl);
    toast.success('Consolidated link copied to clipboard');
  };

  const handleIndividualDownload = (shipment: any, format: string) => {
    const url = shipment.label_urls?.[format] || shipment.label_url;
    if (!url) {
      toast.error(`${format.toUpperCase()} not available for this shipment`);
      return;
    }
    
    onDownloadSingleLabel(url);
    toast.success(`Downloaded ${format.toUpperCase()} label`);
  };

  const handleIndividualPrintPreview = (shipment: any) => {
    const pdfUrl = shipment.label_urls?.pdf;
    if (!pdfUrl) {
      toast.error('PDF not available for this shipment');
      return;
    }
    
    window.open(pdfUrl, '_blank');
    toast.success('Opened label for printing');
  };

  const handleIndividualEmail = (shipment: any, email: string, format: string) => {
    // Here you would call your individual email API
    console.log('Sending individual label to:', email, 'Shipment:', shipment.id, 'Format:', format);
    toast.success(`Label sent to ${email}`);
  };

  const handleIndividualCopyLink = (shipment: any, format: string) => {
    const url = shipment.label_urls?.[format] || shipment.label_url;
    if (!url) {
      toast.error(`${format.toUpperCase()} not available for this shipment`);
      return;
    }
    
    navigator.clipboard.writeText(url);
  };

  if (!results || !results.processedShipments || results.processedShipments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No labels to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Header with Consolidated Actions */}
      <BatchLabelHeader
        totalLabels={results.processedShipments.length}
        successfulLabels={successfulLabels.length}
        failedLabels={failedLabels.length}
        batchId={results.batchResult?.batchId}
        onDownloadConsolidated={handleConsolidatedDownload}
        onPrintConsolidated={handlePrintConsolidated}
        onEmailConsolidated={handleEmailConsolidated}
        onCopyConsolidatedLink={handleCopyConsolidatedLink}
      />

      {/* Individual Labels Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Individual Labels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {successfulLabels.map((shipment, index) => (
            <IndividualLabelCard
              key={shipment.id || index}
              shipment={shipment}
              onDownload={(format) => handleIndividualDownload(shipment, format)}
              onPrintPreview={() => handleIndividualPrintPreview(shipment)}
              onEmail={(email, format) => handleIndividualEmail(shipment, email, format)}
              onCopyLink={(format) => handleIndividualCopyLink(shipment, format)}
            />
          ))}
        </div>
      </div>

      {/* Failed Labels Section */}
      {failedLabels.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-600">Failed Labels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failedLabels.map((shipment, index) => (
              <IndividualLabelCard
                key={shipment.id || index}
                shipment={shipment}
                onDownload={() => {}}
                onPrintPreview={() => {}}
                onEmail={() => {}}
                onCopyLink={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Consolidated Files via Email</DialogTitle>
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
                  <SelectItem value="epl">EPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEmailSubmit} className="flex-1">
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
    </div>
  );
};

export default BatchLabelDisplay;
