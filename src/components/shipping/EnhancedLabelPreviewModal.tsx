
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Mail, Printer, FileText, Image, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Supabase URL constant
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
    name: '8.5x11" - Top Half',
    description: 'One label centered on top half',
    icon: '📋'
  },
  {
    id: '8.5x11-left',
    name: '8.5x11" - Left Side',
    description: 'One label on left side',
    icon: '📄'
  },
  {
    id: '8.5x11-two',
    name: '8.5x11" - Two Labels',
    description: 'Two labels vertically',
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
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('Your Shipping Label');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleDownload = async (format?: string) => {
    if (!labelUrl) {
      toast.error("Label URL is not available");
      return;
    }

    setIsDownloading(true);
    
    try {
      const downloadFormat = format || selectedDownloadFormat;
      console.log(`Downloading label in ${downloadFormat} format`);
      
      if (downloadFormat === 'pdf' && labelUrl.includes('.pdf')) {
        const link = document.createElement('a');
        link.href = labelUrl;
        link.download = `shipping-label-${trackingCode || Date.now()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloaded ${downloadFormat.toUpperCase()} format label`);
      } else {
        toast.info(`${downloadFormat.toUpperCase()} format download will be available soon`);
      }
      
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error("Failed to download label. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailSend = async () => {
    if (!emailAddress.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!trackingCode) {
      toast.error("Tracking code is not available");
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          trackingCode,
          subject: emailSubject,
          format: selectedDownloadFormat,
          toEmail: emailAddress
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Label has been sent to the specified email address');
      setEmailAddress('');
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
      className={`flex items-center gap-2 px-6 py-3 ${
        isActive ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-white">
        <div className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex gap-4">
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
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'preview' && (
              <>
                {/* Format selector */}
                <div className="p-4 bg-white border-b">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Format:</label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {LABEL_FORMATS.map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full screen preview */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-lg w-full h-full max-w-4xl max-h-full overflow-auto">
                    {labelUrl ? (
                      <iframe
                        src={labelUrl}
                        className="w-full h-full border-0 min-h-[600px]"
                        title="Label Preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 min-h-[400px]">
                        <div className="text-center">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p>Preview not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download button at bottom */}
                <div className="p-6 bg-white border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleDownload('pdf')}
                      disabled={isDownloading}
                      className="bg-green-600 hover:bg-green-700 px-12 py-3 text-lg"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isDownloading ? 'Downloading...' : 'Download Label'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'download' && (
              <div className="flex-1 p-8 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-6">Download Options</h2>
                  
                  <Card className="p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">Select Format</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {DOWNLOAD_FORMATS.map((format) => {
                        const IconComponent = format.icon;
                        return (
                          <Button
                            key={format.id}
                            variant={selectedDownloadFormat === format.id ? "default" : "outline"}
                            onClick={() => setSelectedDownloadFormat(format.id)}
                            className="h-20 flex flex-col items-center justify-center gap-2"
                          >
                            <IconComponent className="h-6 w-6" />
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
                      className="bg-blue-600 hover:bg-blue-700 px-12 py-3 text-lg"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isDownloading ? 'Downloading...' : `Download ${selectedDownloadFormat.toUpperCase()}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="flex-1 p-8 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-6">Email Label</h2>
                  
                  <Card className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full"
                      />
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
                      <select
                        value={selectedDownloadFormat}
                        onChange={(e) => setSelectedDownloadFormat(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {DOWNLOAD_FORMATS.map((format) => (
                          <option key={format.id} value={format.id}>
                            {format.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-center pt-4">
                      <Button
                        onClick={handleEmailSend}
                        disabled={isSendingEmail || !emailAddress.trim()}
                        className="bg-blue-600 hover:bg-blue-700 px-12 py-3 text-lg"
                        size="lg"
                      >
                        <Mail className="mr-2 h-5 w-5" />
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
