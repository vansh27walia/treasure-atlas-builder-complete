
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2 } from 'lucide-react';

interface EmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl?: string;
  trackingCode?: string;
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
      png?: string;
    };
    scanFormUrl?: string;
  } | null;
}

const EmailLabelsModal: React.FC<EmailLabelsModalProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingCode,
  batchResult
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please provide an email address');
      return;
    }

    // Determine what to send - individual label or batch result
    const emailData: any = { email };
    
    if (batchResult) {
      // For batch results, use the consolidated PDF URL
      emailData.labelUrl = batchResult.consolidatedLabelUrls.pdf;
      emailData.batchId = batchResult.batchId;
      emailData.isBatch = true;
    } else if (labelUrl) {
      // For individual labels
      emailData.labelUrl = labelUrl;
      emailData.trackingCode = trackingCode;
      emailData.isBatch = false;
    } else {
      toast.error('No label available to send');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: emailData
      });

      if (error) throw error;

      toast.success('Label sent successfully!');
      onClose();
      setEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidLabel = labelUrl || batchResult?.consolidatedLabelUrls?.pdf;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Shipping {batchResult ? 'Labels' : 'Label'}
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
          
          {batchResult && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>This will send all consolidated labels from batch #{batchResult.batchId}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleSendEmail}
              disabled={isLoading || !email || !hasValidLabel}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send {batchResult ? 'Labels' : 'Label'}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelsModal;
