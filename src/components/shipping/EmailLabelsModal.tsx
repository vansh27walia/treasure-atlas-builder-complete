
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, X, Send, FileText, Package } from 'lucide-react';
import { BatchResult } from '@/hooks/useBatchLabelProcessing';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [toEmail, setToEmail] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('Your Shipping Labels');
  const [description, setDescription] = useState('Please find your shipping labels attached to this email. These labels are ready to use for shipping.');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf']);
  const [isSending, setIsSending] = useState(false);

  const availableFormats = batchResult?.consolidatedLabelUrls ? 
    Object.keys(batchResult.consolidatedLabelUrls).filter(format => 
      batchResult.consolidatedLabelUrls[format as keyof typeof batchResult.consolidatedLabelUrls]
    ) : [];

  const handleFormatChange = (format: string, checked: boolean) => {
    if (checked) {
      setSelectedFormats(prev => [...prev, format]);
    } else {
      setSelectedFormats(prev => prev.filter(f => f !== format));
    }
  };

  const handleSendEmail = async () => {
    if (!toEmail.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject line');
      return;
    }

    if (selectedFormats.length === 0) {
      toast.error('Please select at least one format to send');
      return;
    }

    if (!batchResult) {
      toast.error('No batch labels available to send');
      return;
    }

    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          toEmail: toEmail.trim(),
          fromEmail: fromEmail.trim() || undefined,
          subject: subject.trim(),
          description: description.trim(),
          batchResult,
          selectedFormats
        }
      });

      if (error) throw error;

      toast.success(`Email sent successfully to ${toEmail}`);
      console.log('Email sent successfully:', data);
      
      // Reset form
      setToEmail('');
      setFromEmail('');
      setSubject('Your Shipping Labels');
      setDescription('Please find your shipping labels attached to this email. These labels are ready to use for shipping.');
      setSelectedFormats(['pdf']);
      
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      if (error.message?.includes('RESEND_API_KEY')) {
        toast.error('Email service not configured. Please contact support.');
      } else {
        toast.error('Failed to send email. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email Shipping Labels
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Email Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="toEmail" className="text-sm font-medium">
                To Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="toEmail"
                type="email"
                placeholder="recipient@example.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromEmail" className="text-sm font-medium">
                From Email (Optional)
              </Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="your@example.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject Line <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Email Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-20"
              placeholder="Add a personal message..."
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Select Formats to Send <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {availableFormats.map(format => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={format}
                    checked={selectedFormats.includes(format)}
                    onCheckedChange={(checked) => handleFormatChange(format, checked === true)}
                  />
                  <Label htmlFor={format} className="text-sm font-medium cursor-pointer">
                    {format.toUpperCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview of what will be sent */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Files to be attached:
            </h4>
            <ul className="space-y-1 text-sm text-blue-700">
              {selectedFormats.map(format => (
                <li key={format} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Consolidated {format.toUpperCase()} Labels
                </li>
              ))}
              {batchResult?.scanFormUrl && (
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Pickup Manifest (Scan Form)
                </li>
              )}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={isSending || !toEmail.trim() || !subject.trim() || selectedFormats.length === 0}
              className="bg-green-600 hover:bg-green-700"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailLabelsModal;
