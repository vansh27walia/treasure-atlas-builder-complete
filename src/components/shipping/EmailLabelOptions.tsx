
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, Loader } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailLabelOptionsProps {
  labelUrl?: string;
  trackingCode?: string;
  onClose: () => void;
  mode?: 'single' | 'bulk';
  batchLabels?: Array<{url: string, recipient: string}>;
}

const EmailLabelOptions: React.FC<EmailLabelOptionsProps> = ({
  labelUrl,
  trackingCode,
  onClose,
  mode = 'single',
  batchLabels = []
}) => {
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    subject: mode === 'bulk' ? 'Your Shipping Labels' : 'Your Shipping Label',
    message: mode === 'bulk' 
      ? 'Please find your shipping labels attached. Thank you for your business!'
      : `Your shipping label is attached. Tracking number: ${trackingCode || 'N/A'}. Thank you for your business!`,
    emailType: 'customer'
  });
  const [isSending, setIsSending] = useState(false);

  const emailTemplates = {
    customer: {
      subject: mode === 'bulk' ? 'Your Shipping Labels are Ready' : 'Your Shipping Label is Ready',
      message: mode === 'bulk'
        ? 'Dear Customer,\n\nYour shipping labels have been generated and are attached to this email. Please print them and affix them to your packages.\n\nThank you for choosing our shipping service!\n\nBest regards,\nShipping Team'
        : `Dear Customer,\n\nYour shipping label has been generated and is attached to this email.\n\nTracking Number: ${trackingCode || 'N/A'}\n\nPlease print the label and affix it to your package.\n\nThank you for choosing our shipping service!\n\nBest regards,\nShipping Team`
    },
    business: {
      subject: mode === 'bulk' ? 'Shipping Labels - Order Processing' : 'Shipping Label - Order Processing',
      message: mode === 'bulk'
        ? 'Hello,\n\nThe requested shipping labels have been generated and processed. Labels are attached for your review and use.\n\nPlease ensure all packages are properly labeled before dispatch.\n\nRegards,\nShipping Operations'
        : `Hello,\n\nThe shipping label for this order has been generated and processed.\n\nTracking Number: ${trackingCode || 'N/A'}\n\nLabel is attached for your review and use.\n\nRegards,\nShipping Operations`
    },
    notification: {
      subject: mode === 'bulk' ? 'Shipping Labels Generated - Action Required' : 'Shipping Label Generated - Action Required',
      message: mode === 'bulk'
        ? 'This is an automated notification that shipping labels have been generated for your recent orders.\n\nLabels are attached and ready for use. Please download and print them at your earliest convenience.\n\nThis is an automated message, please do not reply.'
        : `This is an automated notification that a shipping label has been generated for your recent order.\n\nTracking Number: ${trackingCode || 'N/A'}\n\nLabel is attached and ready for use. Please download and print it at your earliest convenience.\n\nThis is an automated message, please do not reply.`
    }
  };

  const handleTemplateChange = (type: string) => {
    const template = emailTemplates[type as keyof typeof emailTemplates];
    setEmailData(prev => ({
      ...prev,
      emailType: type,
      subject: template.subject,
      message: template.message
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail) {
      toast.error('Please enter a recipient email address');
      return;
    }

    if (!labelUrl && (!batchLabels || batchLabels.length === 0)) {
      toast.error('No labels available to send');
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          email: emailData.recipientEmail,
          subject: emailData.subject,
          description: emailData.message,
          labelUrl: mode === 'single' ? labelUrl : (batchLabels?.[0]?.url || null),
          trackingCode: trackingCode,
          isBatch: mode === 'bulk',
          batchResult: mode === 'bulk' && batchLabels && batchLabels.length > 0 ? {
            consolidatedLabelUrls: {
              pdf: batchLabels[0]?.url || ''
            }
          } : null
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
      toast.success(`Email sent successfully to ${emailData.recipientEmail}`);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email. Please check your email settings.';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email {mode === 'bulk' ? 'Labels' : 'Label'}
        </CardTitle>
        <CardDescription>
          Send the shipping {mode === 'bulk' ? 'labels' : 'label'} via email with a personalized message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Type Template Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Template Type</label>
          <Select
            value={emailData.emailType}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer Email</SelectItem>
              <SelectItem value="business">Business Email</SelectItem>
              <SelectItem value="notification">Automated Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recipient Email *</label>
          <Input
            type="email"
            placeholder="Enter recipient email address"
            value={emailData.recipientEmail}
            onChange={(e) => setEmailData(prev => ({ ...prev, recipientEmail: e.target.value }))}
            required
          />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Subject</label>
          <Input
            placeholder="Email subject"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Email message"
            value={emailData.message}
            onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
            rows={6}
            className="resize-none"
          />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>What will be sent:</strong><br />
            {mode === 'bulk' 
              ? `• ${batchLabels?.length || 0} shipping labels as attachments`
              : `• Shipping label as PDF attachment${trackingCode ? `\n• Tracking number: ${trackingCode}` : ''}`
            }
            <br />
            • Your personalized message
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSending || !emailData.recipientEmail}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
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
      </CardContent>
    </Card>
  );
};

export default EmailLabelOptions;
