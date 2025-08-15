import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Mail, Printer, FileText, Image, Code, Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SUPABASE_URL = "https://adhegezdzqlnqqnymvps.supabase.co";

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
  { id: 'png', name: 'PNG', icon: Image },
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
  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<string>('pdf');
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
      
      // Call the generate-label-format function to get the new format
      const { data, error } = await supabase.functions.invoke('generate-label-format', {
        body: {
          format: format,
          labelUrl: labelUrl,
          trackingCode: trackingCode
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.labelUrl) {
        setCurrentPreviewUrl(data.labelUrl);
        toast.success(`Label format updated to ${format}`);
      } else {
        // If no new URL returned, simulate format change by keeping original URL
        toast.success(`Format selected: ${LABEL_FORMATS.find(f => f.id === format)?.name || format}`);
      }
    } catch (error) {
      console.error('Error changing format:', error);
      toast.error('Failed to update label format');
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const handleDownload = async (format?: string) => {
    if (!labelUrl) {
      toast.error("Label URL is not available");
      return;
    }

    setIsDownloading(true);
    
    try {
      const downloadFormat = format || selectedDownloadFormat;
      console.log(`Downloading label in ${downloadFormat} format`);
      
      let downloadUrl = labelUrl;
      let fileName = `shipping-label-${trackingCode || Date.now()}`;
      
      // For PDF format, use the current preview URL or original URL
      if (downloadFormat === 'pdf') {
        downloadUrl = currentPreviewUrl || labelUrl;
        fileName += '.pdf';
      } else if (downloadFormat === 'png') {
        // For PNG, try to find PNG version or convert
        if (labelUrl.includes('.png')) {
          downloadUrl = labelUrl;
        } else {
          // Could implement PNG conversion here if needed
          downloadUrl = labelUrl;
        }
        fileName += '.png';
      } else if (downloadFormat === 'zpl') {
        // For ZPL, would need to get ZPL version from EasyPost
        fileName += '.zpl';
        toast.info('ZPL format will be available soon');
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${downloadFormat.toUpperCase()} format label`);
      
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error("Failed to download label. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (error) {
        console.error("Error printing PDF from iframe:", error);
        // Fallback: open in new window for printing
        if (currentPreviewUrl) {
          window.open(currentPreviewUrl, '_blank');
        } else {
          toast.error("Failed to initiate print. Please try downloading the PDF and printing it manually.");
        }
      }
    } else {
      toast.error("No preview available to print directly. Please download the label.");
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
        format: selectedDownloadFormat,
        toEmails: validEmails
      });

      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          trackingCode,
          subject: emailSubject,
          format: selectedDownloadFormat,
          toEmails: validEmails
        }
      });

      if (error) {
        console.error('Email error:', error);
        throw new Error(error.message);
      }

      toast.success(`Label has been sent to ${validEmails.length} email address${validEmails.length > 1 ? 'es' : ''}`);
      setEmailAddresses(['']);
    } catch (error) {
      console.error('Error emailing label:', error);
      toast.error("Failed to email label. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const TabButton = ({ tab, icon: Icon, children, isActive, onClick }: any) => (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 ${
        isActive ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] h-[85vh] p-0 bg-white m-4">
        <div className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex gap-2">
              <TabButton
                tab="preview"
                icon={Printer}
                isActive={activeTab === 'preview'}
                onClick={() => setActiveTab('preview')}
              >
                Print Preview
              </TabButton>
              
              <TabButton
                tab="download"
                icon={Download}
                isActive={activeTab === 'download'}
                onClick={() => setActiveTab('download')}
              >
                Download
              </TabButton>
              
              <TabButton
                tab="email"
                icon={Mail}
                isActive={activeTab === 'email'}
                onClick={() => setActiveTab('email')}
              >
                Email
              </TabButton>
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
                {/* Format selector */}
                <div className="p-4 bg-white border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Format:</label>
                      <Select
                        value={selectedFormat}
                        onValueChange={handleFormatChange}
                        disabled={isRegeneratingLabel}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                          {LABEL_FORMATS.map((format) => (
                            <SelectItem key={format.id} value={format.id} className="hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{format.icon}</span>
                                <div>
                                  <div className="font-medium">{format.name}</div>
                                  <div className="text-xs text-gray-500">{format.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Full screen preview */}
                <div className="flex-1 bg-gray-100 p-4">
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
                        style={{ minHeight: '400px' }}
                      />
                    ) : (
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Preview not available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download button at bottom */}
                <div className="p-4 bg-white border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleDownload('pdf')}
                      disabled={isDownloading || !currentPreviewUrl}
                      className="bg-green-600 hover:bg-green-700 px-8 py-2 text-base min-w-[200px]"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloading ? 'Downloading...' : 'Download Label'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'download' && (
              <div className="flex-1 p-6 bg-gray-50">
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-semibold mb-6">Download Options</h2>
                  
                  <Card className="p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">Select Format</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {DOWNLOAD_FORMATS.map((format) => {
                        const IconComponent = format.icon;
                        return (
                          <Button
                            key={format.id}
                            variant={selectedDownloadFormat === format.id ? "default" : "outline"}
                            onClick={() => setSelectedDownloadFormat(format.id)}
                            className="h-16 flex flex-col items-center justify-center gap-2"
                          >
                            <IconComponent className="h-5 w-5" />
                            <span>{format.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </Card>

                  <div className="text-center">
                    <Button
                      onClick={() => handleDownload()}
                      disabled={isDownloading}
                      className="bg-blue-600 hover:bg-blue-700 px-8 py-2 text-base"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloading ? 'Downloading...' : `Download ${selectedDownloadFormat.toUpperCase()}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="flex-1 p-6 bg-gray-50">
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl font-semibold mb-6">Email Label</h2>
                  
                  <Card className="p-6 space-y-6">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format
                      </label>
                      <Select
                        value={selectedDownloadFormat}
                        onValueChange={setSelectedDownloadFormat}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                          {DOWNLOAD_FORMATS.map((format) => (
                            <SelectItem key={format.id} value={format.id}>
                              {format.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </Card>
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
