
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: {
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
  batchResult
}) => {
  const [formData, setFormData] = useState({
    toEmails: [''],
    subject: 'Your Shipping Labels',
    description: 'Please find your shipping labels attached to this email.',
    selectedFormats: ['pdf']
  });
  const [isSending, setIsSending] = useState(false);

  const handleAddEmail = () => {
    setFormData(prev => ({
      ...prev,
      toEmails: [...prev.toEmails, '']
    }));
  };

  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      toEmails: prev.toEmails.filter((_, i) => i !== index)
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      toEmails: prev.toEmails.map((email, i) => i === index ? value : email)
    }));
  };

  const handleFormatChange = (format: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedFormats: checked 
        ? [...prev.selectedFormats, format]
        : prev.selectedFormats.filter(f => f !== format)
    }));
  };

  const handleSendEmail = async () => {
    const validEmails = formData.toEmails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0 || !formData.subject) {
      toast.error('Please fill in at least one email address and subject');
      return;
    }

    if (formData.selectedFormats.length === 0) {
      toast.error('Please select at least one format to send');
      return;
    }

    setIsSending(true);

    try {
      console.log('Sending email with data:', { 
        toEmails: validEmails, 
        subject: formData.subject,
        selectedFormats: formData.selectedFormats,
        batchResult 
      });

      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          toEmails: validEmails,
          subject: formData.subject,
          description: formData.description,
          batchResult,
          selectedFormats: formData.selectedFormats
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      console.log('Email function response:', data);
      toast.success(`Email sent successfully to ${validEmails.length} recipient(s)!`);
      onClose();
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const availableFormats = [
    { value: 'pdf', label: 'PDF', available: !!batchResult?.consolidatedLabelUrls.pdf },
    { value: 'zpl', label: 'ZPL', available: !!batchResult?.consolidatedLabelUrls.zpl },
    { value: 'epl', label: 'EPL', available: !!batchResult?.consolidatedLabelUrls.epl }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Email Shipping Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Emails */}
          <div className="space-y-2">
            <Label>To Email(s) *</Label>
            {formData.toEmails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="flex-1"
                />
                {formData.toEmails.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveEmail(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {index === formData.toEmails.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEmail}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Message</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a message to include with the labels..."
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Label Formats to Include</Label>
            <div className="space-y-2">
              {availableFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={format.value}
                    checked={formData.selectedFormats.includes(format.value)}
                    onChange={(e) => handleFormatChange(format.value, e.target.checked)}
                    disabled={!format.available}
                    className="rounded border-gray-300"
                  />
                  <Label 
                    htmlFor={format.value} 
                    className={`text-sm ${!format.available ? 'text-gray-400' : ''}`}
                  >
                    {format.label} {!format.available && '(Not available)'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Form Option */}
          {batchResult?.scanFormUrl && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="scanForm"
                checked={formData.selectedFormats.includes('scanForm')}
                onChange={(e) => handleFormatChange('scanForm', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="scanForm" className="text-sm">
                Include Pickup Manifest (Scan Form)
              </Label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
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
