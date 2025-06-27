
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
    };
    scanFormUrl?: string;
  } | null;
}

const EmailLabelsModal: React.FC<EmailLabelsModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Your Shipping Labels');
  const [selectedFormats, setSelectedFormats] = useState({
    pdf: true,
    zpl: false,
    epl: false,
    manifest: false
  });
  const [isSending, setIsSending] = useState(false);

  const handleFormatChange = (format: string, checked: boolean) => {
    setSelectedFormats(prev => ({
      ...prev,
      [format]: checked
    }));
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!batchResult) {
      toast.error('No batch data available');
      return;
    }

    const selectedUrls: { [key: string]: string } = {};
    
    if (selectedFormats.pdf && batchResult.consolidatedLabelUrls.pdf) {
      selectedUrls.pdf = batchResult.consolidatedLabelUrls.pdf;
    }
    if (selectedFormats.zpl && batchResult.consolidatedLabelUrls.zpl) {
      selectedUrls.zpl = batchResult.consolidatedLabelUrls.zpl;
    }
    if (selectedFormats.epl && batchResult.consolidatedLabelUrls.epl) {
      selectedUrls.epl = batchResult.consolidatedLabelUrls.epl;
    }
    if (selectedFormats.manifest && batchResult.scanFormUrl) {
      selectedUrls.manifest = batchResult.scanFormUrl;
    }

    if (Object.keys(selectedUrls).length === 0) {
      toast.error('Please select at least one format to send');
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-labels-email', {
        body: {
          email,
          subject,
          batchId: batchResult.batchId,
          labelUrls: selectedUrls
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Labels sent successfully to your email!');
      onClose();
      
      // Reset form
      setEmail('');
      setSubject('Your Shipping Labels');
      setSelectedFormats({
        pdf: true,
        zpl: false,
        epl: false,
        manifest: false
      });

    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-blue-600" />
            Email Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-3">
            <Label>Select Formats to Send</Label>
            
            {batchResult?.consolidatedLabelUrls?.pdf && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdf"
                  checked={selectedFormats.pdf}
                  onCheckedChange={(checked) => handleFormatChange('pdf', checked as boolean)}
                />
                <Label htmlFor="pdf" className="text-sm">PDF Labels</Label>
              </div>
            )}

            {batchResult?.consolidatedLabelUrls?.zpl && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="zpl"
                  checked={selectedFormats.zpl}
                  onCheckedChange={(checked) => handleFormatChange('zpl', checked as boolean)}
                />
                <Label htmlFor="zpl" className="text-sm">ZPL Format</Label>
              </div>
            )}

            {batchResult?.consolidatedLabelUrls?.epl && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="epl"
                  checked={selectedFormats.epl}
                  onCheckedChange={(checked) => handleFormatChange('epl', checked as boolean)}
                />
                <Label htmlFor="epl" className="text-sm">EPL Format</Label>
              </div>
            )}

            {batchResult?.scanFormUrl && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manifest"
                  checked={selectedFormats.manifest}
                  onCheckedChange={(checked) => handleFormatChange('manifest', checked as boolean)}
                />
                <Label htmlFor="manifest" className="text-sm">Pickup Manifest</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelsModal;
