
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X, FileText, Eye, Loader2, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ConsolidatedLabelUrls } from '@/types/shipping';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-top', label: '8.5x11" - Top Position', description: 'Label positioned at top of page' },
  { value: '8.5x11-center', label: '8.5x11" - Center Position', description: 'Label centered on page' },
  { value: '8.5x11-2up', label: '8.5x11" - Two Labels Side by Side', description: 'Two labels horizontally arranged' }
];

interface PrintPreviewProps {
  triggerButton?: React.ReactNode;
  isOpenProp?: boolean;
  onOpenChangeProp?: (open: boolean) => void;
  labelUrl: string;
  trackingCode: string | null;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  onFormatChange?: (format: string) => Promise<void>;
  onBatchFormatChange?: (format: string) => Promise<void>;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: ConsolidatedLabelUrls;
    scanFormUrl: string | null;
  };
  isBatchPreview?: boolean;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentDetails,
  onFormatChange,
  onBatchFormatChange,
  shipmentId,
  labelUrls,
  batchResult,
  isBatchPreview = false
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChangeProp) {
      onOpenChangeProp(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [activeTab, setActiveTab] = useState<'preview' | 'email'>('preview');
  const [emailAddresses, setEmailAddresses] = useState<string[]>(['']);
  const [emailSubject, setEmailSubject] = useState('Your Shipping Label');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('placeholder');

  useEffect(() => {
    if (isBatchPreview) {
      if (batchResult?.consolidatedLabelUrls?.pdf) {
        setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
        setPreviewType('pdf');
        setSelectedFormat('8.5x11-2up');
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
    } else {
      if (labelUrls?.pdf) {
        setCurrentPreviewUrl(labelUrls.pdf);
        setPreviewType('pdf');
      } else if (labelUrl && labelUrl.endsWith('.png')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('image');
      } else if (labelUrl) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('pdf');
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
      setSelectedFormat('4x6');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const generateLabelPDF = async (fileBytes: ArrayBuffer, layoutOption: string): Promise<Uint8Array> => {
    try {
      const originalPdf = await PDFDocument.load(fileBytes);
      const outputPdf = await PDFDocument.create();

      const copiedPages = await outputPdf.copyPages(originalPdf, [0]);
      const embeddedPage = copiedPages[0];

      const letterWidth = 612;
      const letterHeight = 792;
      const labelWidth = 288;
      const labelHeight = 432;

      if (layoutOption === '4x6') {
        const page = outputPdf.addPage([labelWidth, labelHeight]);
        page.drawPage(embeddedPage, { x: 0, y: 0, width: labelWidth, height: labelHeight });
      } else if (layoutOption === '8.5x11-2up') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { x: (letterWidth - labelWidth) / 2, y: 360, width: labelWidth, height: labelHeight });
        page.drawPage(embeddedPage, { x: (letterWidth - labelWidth) / 2, y: 0, width: labelWidth, height: labelHeight });
      } else if (layoutOption === '8.5x11-top') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { x: (letterWidth - labelWidth) / 2, y: 360, width: labelWidth, height: labelHeight });
      } else if (layoutOption === '8.5x11-center') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { x: (letterWidth - labelWidth) / 2, y: 180, width: labelWidth, height: labelHeight });
      }

      return await outputPdf.save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (currentPreviewUrl) {
        const response = await fetch(currentPreviewUrl);
        const fileBytes = await response.arrayBuffer();
        
        const pdfBytes = await generateLabelPDF(fileBytes, format);
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const newUrl = URL.createObjectURL(blob);
        setCurrentPreviewUrl(newUrl);
        
        toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label || format}`);
      }
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const handleDownload = async () => {
    if (!currentPreviewUrl) {
      toast.error("No label available for download");
      return;
    }

    try {
      const response = await fetch(currentPreviewUrl);
      const fileBytes = await response.arrayBuffer();
      
      let pdfBytes: Uint8Array;
      if (selectedFormat !== '4x6') {
        pdfBytes = await generateLabelPDF(fileBytes, selectedFormat);
      } else {
        pdfBytes = new Uint8Array(fileBytes);
      }

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Label downloaded successfully');
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file.");
    }
  };

  const handlePrint = () => {
    if (previewType === 'pdf' && iframeRef.current && iframeRef.current.contentWindow) {
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
      setEmailAddresses(['']);
    } catch (error) {
      console.error('Error emailing label:', error);
      toast.error("Failed to email label. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={handleDownload}
            disabled={!currentPreviewUrl}
          >
            <Download className="h-3 w-3 mr-1" />
            Download Label
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
              <Eye className="h-3 w-3 mr-1" />
              Print Preview
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 bg-white">
        <div className="flex flex-col h-full">
          {/* Header with tabs */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
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
                tab="email"
                icon={Mail}
                isActive={activeTab === 'email'}
                onClick={() => setActiveTab('email')}
              >
                Email Label
              </TabButton>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Format:</label>
                      <Select
                        value={selectedFormat}
                        onValueChange={handleFormatChange}
                        disabled={isRegeneratingLabel}
                      >
                        <SelectTrigger className="w-80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                          {labelFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value} className="hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium">{format.label}</div>
                                  <div className="text-xs text-gray-500">{format.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      onClick={handlePrint}
                      disabled={isRegeneratingLabel || !currentPreviewUrl}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
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
                        style={{ minHeight: '70vh' }}
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
                <div className="p-6 bg-white border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={handleDownload}
                      disabled={!currentPreviewUrl}
                      className="bg-green-600 hover:bg-green-700 px-12 py-3 text-lg min-w-[300px]"
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download Label
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'email' && (
              <div className="flex-1 p-8 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold mb-6">Email Label</h2>
                  
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
                        className="bg-blue-600 hover:bg-blue-700 px-12 py-3 text-lg"
                        size="lg"
                      >
                        <Mail className="mr-2 h-5 w-5" />
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

export default PrintPreview;
