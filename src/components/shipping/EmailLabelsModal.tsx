
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, X } from 'lucide-react';
import { BatchResult } from '@/hooks/useBatchLabelProcessing';
import { toast } from 'sonner';

interface EmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: BatchResult | null;
}

const EmailLabelsModal: React.FC<EmailLabelsModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!batchResult) {
      toast.error('No batch labels available to send');
      return;
    }

    setIsSending(true);
    
    try {
      // This would typically call a backend endpoint to send emails
      // For now, we'll show a success message
      toast.success(`Consolidated labels will be sent to ${email}`);
      console.log('Would send email to:', email, 'with batch result:', batchResult);
      
      // In a real implementation, you would call:
      // const { error } = await supabase.functions.invoke('send-batch-labels-email', {
      //   body: { email, batchResult }
      // });
      
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Email Consolidated Labels</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>The following will be sent:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {batchResult?.consolidatedLabelUrls.pdf && <li>Consolidated PDF Labels</li>}
              {batchResult?.consolidatedLabelUrls.png && <li>Consolidated PNG Labels</li>}
              {batchResult?.consolidatedLabelUrls.zpl && <li>Consolidated ZPL Labels</li>}
              {batchResult?.consolidatedLabelUrls.epl && <li>Consolidated EPL Labels</li>}
              {batchResult?.scanFormUrl && <li>Scan Form (Manifest)</li>}
            </ul>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelsModal;
