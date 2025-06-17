
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface EmailLabelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  labelUrl?: string | null;
  onSendEmail: (email: string, subject: string, labelUrl: string) => void;
  isBatch?: boolean;
}

const EmailLabelModal: React.FC<EmailLabelModalProps> = ({
  isOpen,
  onOpenChange,
  labelUrl,
  onSendEmail,
  isBatch = false
}) => {
  const [email, setEmail] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subjectOptions = [
    'Your Shipping Label is Ready',
    'Package Label - Please Print',
    'Shipping Documentation Attached',
    'Your Order Label for Pickup',
    'Express Shipping Label Enclosed',
    isBatch ? 'Batch Shipping Labels Ready' : 'Single Shipping Label Ready',
    'Priority Mail Label - Action Required',
    'Shipping Labels for Processing'
  ];

  const handleSendEmail = async () => {
    const targetEmail = useCustomEmail ? customEmail : email;
    
    if (!targetEmail || !subject || !labelUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await onSendEmail(targetEmail, subject, labelUrl);
      toast.success(`${isBatch ? 'Batch labels' : 'Label'} sent successfully to ${targetEmail}`);
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setCustomEmail('');
      setSubject('');
      setUseCustomEmail(false);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email {isBatch ? 'Batch Labels' : 'Label'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Destination</Label>
            <div className="space-y-2">
              <Button
                variant={!useCustomEmail ? "default" : "outline"}
                onClick={() => setUseCustomEmail(false)}
                className="w-full justify-start"
              >
                Use Saved Email Address
              </Button>
              
              {!useCustomEmail && (
                <Input
                  type="email"
                  placeholder="Enter saved email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              
              <Button
                variant={useCustomEmail ? "default" : "outline"}
                onClick={() => setUseCustomEmail(true)}
                className="w-full justify-start"
              >
                Use Custom Email Address
              </Button>
              
              {useCustomEmail && (
                <Input
                  type="email"
                  placeholder="Enter custom email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject line" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isLoading || !labelUrl}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelModal;
