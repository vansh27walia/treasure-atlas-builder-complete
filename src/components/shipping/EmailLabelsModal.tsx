
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Mail, Send, X, FileText, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: any;
}

const EmailLabelsModal: React.FC<EmailLabelsModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Your Shipping Labels');
  const [message, setMessage] = useState('Please find your shipping labels attached.');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !subject) {
      toast.error('Please enter email address and subject line');
      return;
    }

    if (!batchResult?.consolidatedLabelUrls?.pdf) {
      toast.error('No labels available to send');
      return;
    }

    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-shipping-labels', {
        body: {
          email,
          subject,
          message,
          labelUrls: batchResult.consolidatedLabelUrls,
          manifestUrl: batchResult.scanFormUrl,
          totalLabels: batchResult.totalLabels || 0
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Labels sent successfully to ${email}`);
      onClose();
      
      // Reset form
      setEmail('');
      setSubject('Your Shipping Labels');
      setMessage('Please find your shipping labels attached.');
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <Mail className="h-5 w-5 text-white" />
            </div>
            Email Shipping Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">
                  Ready to send: {batchResult?.totalLabels || 0} labels
                </span>
              </div>
              <div className="text-sm text-blue-600">
                PDF + Manifest included
              </div>
            </div>
          </Card>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Recipient Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject Line *
              </Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium">
                Message (Optional)
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          {/* Attachment Preview */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-medium mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Attachments
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Consolidated Labels (PDF)</span>
                <span className="text-green-600">✓ Ready</span>
              </div>
              {batchResult?.scanFormUrl && (
                <div className="flex justify-between items-center">
                  <span>Pickup Manifest (PDF)</span>
                  <span className="text-green-600">✓ Ready</span>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !email || !subject}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Labels
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelsModal;
