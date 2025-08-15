import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Mail, Printer, FileText, FileImage, Code, Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Label format options
const LABEL_FORMATS = [
  {
    id: '4x6',
    name: '4x6" Shipping Label',
    description: 'Standard thermal label format',
    icon: '📄'
  },
  {
    id: '8.5x11-top',
    name: '8.5x11" - Top Position',
    description: 'Label positioned at top of page',
    icon: '📋'
  },
  {
    id: '8.5x11-center',
    name: '8.5x11" - Center Position',
    description: 'Label centered on page',
    icon: '📄'
  },
  {
    id: '8.5x11-two',
    name: '8.5x11" - Two Labels Side by Side',
    description: 'Two labels horizontally arranged',
    icon: '📋'
  }
];

const DOWNLOAD_FORMATS = [
  { id: 'pdf', name: 'PDF', icon: FileText },
  { id: 'png', name: 'PNG', icon: FileImage }, // Corrected icon for clarity
  { id: 'zpl', name: 'ZPL', icon: Code }
];

interface EnhancedLabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string | null;
  trackingCode: string | null;
}

const EnhancedLabelPreviewModal: React.FC<EnhancedLabelPreviewModalProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingCode
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'download' | 'email'>('preview');
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [emailAddresses, setEmailAddresses] = useState<string[]>(['']);
  const [emailSubject, setEmailSubject] = useState('Your Shipping Label');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (labelUrl) {
      setCurrentPreviewUrl(labelUrl);
    }
  }, [labelUrl, isOpen]);

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      console.log(`Changing format to: ${format}`);
      // This is a placeholder as the PDF-Lib functionality from the first code block isn't present here.
      // You would need to implement or call a function to regenerate the label in the new format.
      toast.info(`Attempting to regenerate label in ${format} format...`);
      // Simulating a network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real scenario, you'd update currentPreviewUrl with the new URL
      // For now, it stays the same
      toast.success('Label format change simulated successfully.');
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const addEmailAddress = () => {
    setEmailAddresses([...emailAddresses, '']);
  };

  const removeEmailAddress = (index: number) => {
    if (emailAddresses.length > 1) {
      setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    }
  };

  const updateEmailAddress = (index: number, value: string) => {
    const newAddresses = [...emailAddresses];
    newAddresses[index] = value;
    setEmailAddresses(newAddresses);
  };

  const handleEmailSend = async () => {
    const validEmails = emailAddresses.filter(email => email.trim());

    if (validEmails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    if (!trackingCode) {
      toast.error("Tracking code is not available");
      return;
    }

    setIsSendingEmail(true);

    try {
      console.log('Sending email with:', {
        trackingCode,
        subject: emailSubject,
        format: 'pdf',
        toEmails: validEmails
      });

      // Invoke the Supabase Edge Function to send the email
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          trackingCode,
          subject: emailSubject,
          format: 'pdf',
          toEmails: validEmails
        }
      });

      if (error) {
        console.error('Email error:', error);
        throw new Error(error.message);
      }

      toast.success(`Label has been sent to ${validEmails.length} email address${validEmails.length > 1 ? 'es' : ''}`);
      setEmailAddresses(['']); // Reset email addresses
    } catch (error) {
      console.error('Error emailing label:', error);
      toast.error("Failed to email label. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Helper function to download a file from a URL
  const downloadFile = async (url: string, fileName: string) => {
    try {
      setIsDownloading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started successfully.');
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl') => {
    if (!currentPreviewUrl) {
      toast.error("No label available for download");
      return;
    }

    const fileName = `shipping_label_${trackingCode || Date.now()}.${format}`;
    downloadFile(currentPreviewUrl, fileName);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (error) {
        console.error("Error printing PDF from iframe:", error);
        toast.error("Failed to initiate print. Please try downloading the PDF and printing it manually.");
      }
    } else {
      toast.error("No PDF preview available to print directly. Please download the label.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-white m-4">
        <div className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'preview' ? "default" : "outline"}
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Printer className="h-4 w-4" />
                Print Preview
              </Button>

              <Button
                variant={activeTab === 'download' ? "default" : "outline"}
                onClick={() => setActiveTab('download')}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>

              <Button
                variant={activeTab === 'email' ? "default" : "outline"}
                onClick={() => setActiveTab('email')}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'preview' && (
              <>
                <div className="p-4 bg-white border-b">
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-2xl">
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Select Label Format:</label>
                      <Select
                        value={selectedFormat}
                        onValueChange={handleFormatChange}
                        disabled={isRegeneratingLabel}
                      >
                        <SelectTrigger className="w-full h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999] w-full">
                          {LABEL_FORMATS.map((format) => (
                            <SelectItem key={format.id} value={format.id} className="hover:bg-gray-50 p-4">
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex-1">
                                  <div className="font-medium text-base">{format.name}</div>
                                  <div className="text-sm text-gray-500">{format.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-gray-100 p-2">
                  <div className="bg-white rounded-lg shadow-lg w-full h-full flex items-center justify-center">
                    {isRegeneratingLabel ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-blue-800 text-lg">Regenerating label...</p>
                      </div>
                    ) : currentPreviewUrl ? (
                      <iframe
                        ref={iframeRef}
                        src={currentPreviewUrl}
                        className="w-full h-full border-0 rounded-lg"
                        title="Label Preview"
                        style={{ minHeight: '500px' }}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Preview not available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-white border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleDownload('pdf')}
                      disabled={!currentPreviewUrl}
                      className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg min-w-[250px]"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Label
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'download' && (
              <div className="flex-1 p-6 bg-gray-50">
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-semibold mb-6">Download Options</h2>

                  <div className="grid grid-cols-1 gap-4">
                    {DOWNLOAD_FORMATS.map((format) => (
                      <div key={format.id} className="border rounded-lg p-4 text-center hover:border-blue-300 transition-colors bg-white">
                        <format.icon className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                        <h4 className="font-medium mb-2">{format.name} Format</h4>
                        <p className="text-xs text-gray-500 mb-4">
                          {format.id === 'pdf' ? 'Professional document format. Ideal for printing and archiving shipment records.' :
                           format.id === 'png' ? 'High-quality image format. Perfect for most standard printers and email attachments.' :
                           'Zebra Programming Language. Optimized for thermal label printers and industrial use.'}
                        </p>
                        <Button
                          onClick={() => handleDownload(format.id as 'pdf' | 'png' | 'zpl')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={!currentPreviewUrl || isDownloading}
                        >
                          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Download {format.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="flex-1 p-6 bg-gray-50">
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-semibold mb-6">Email Label</h2>

                  <div className="bg-white rounded-lg p-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Email Addresses
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEmailAddress}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Email
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {emailAddresses.map((email, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => updateEmailAddress(index, e.target.value)}
                              placeholder="Enter email address"
                              className="flex-1"
                            />
                            {emailAddresses.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeEmailAddress(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <Input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Your Shipping Label"
                        className="w-full"
                      />
                    </div>

                    <div className="text-center pt-4">
                      <Button
                        onClick={handleEmailSend}
                        disabled={isSendingEmail || emailAddresses.every(email => !email.trim())}
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-2 text-base"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {isSendingEmail ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedLabelPreviewModal;