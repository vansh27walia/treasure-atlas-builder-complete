import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2, Files, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState<'preview' | 'download' | 'email'>('preview');
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
      const [labelPage] = await originalPdf.copyPages(originalPdf, [0]);

      // Page sizes in points
      const letterWidth = 612;  // 8.5"
      const letterHeight = 792; // 11"
      const labelWidth = 288;   // 4"
      const labelHeight = 432;  // 6"

      const outputPdf = await PDFDocument.create();

      if (layoutOption === '4x6') {
        // Keep as original
        const page = outputPdf.addPage([labelWidth, labelHeight]);
        page.drawPage(labelPage, { x: 0, y: 0, width: labelWidth, height: labelHeight });

      } else if (layoutOption === '8.5x11-2up') {
        // Two labels: top & bottom
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(labelPage, { x: (letterWidth - labelWidth) / 2, y: 360, width: labelWidth, height: labelHeight }); // top
        page.drawPage(labelPage, { x: (letterWidth - labelWidth) / 2, y: 0, width: labelWidth, height: labelHeight });   // bottom

      } else if (layoutOption === '8.5x11-top') {
        // Single label at top
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(labelPage, { x: (letterWidth - labelWidth) / 2, y: 360, width: labelWidth, height: labelHeight });

      } else if (layoutOption === '8.5x11-center') {
        // Single label at center
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(labelPage, { x: (letterWidth - labelWidth) / 2, y: 180, width: labelWidth, height: labelHeight });
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
        // Fetch the original PDF
        const response = await fetch(currentPreviewUrl);
        const fileBytes = await response.arrayBuffer();
        
        // Generate new PDF with selected format
        const pdfBytes = await generateLabelPDF(fileBytes, format);
        
        // Create new blob URL for preview
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

  const downloadFile = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Successfully initiated download for ${fileName}`);
      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file.");
    }
  };

  const handleDownloadIndividualFormat = (format: 'png' | 'pdf' | 'zpl') => {
    console.log('Download individual format attempt:', format, labelUrls);
    let urlToDownload = labelUrls?.[format];

    if (format === 'pdf' && !urlToDownload && labelUrl && labelUrl.endsWith('.pdf')) {
      urlToDownload = labelUrl;
    } else if (format === 'png' && !urlToDownload && labelUrl && labelUrl.endsWith('.png')) {
      urlToDownload = labelUrl;
    } else if (format === 'png' && !urlToDownload && labelUrl) {
      // Use the same URL for PNG if not available
      urlToDownload = labelUrl;
    } else if (format === 'zpl' && !urlToDownload && labelUrls?.pdf) {
      // Try to use PDF URL for ZPL if ZPL not available
      urlToDownload = labelUrls.pdf;
    }

    if (!urlToDownload) {
      console.error(`No URL available for individual ${format} format`);
      toast.error(`${format.toUpperCase()} format not available for this label.`);
      return;
    }
    downloadFile(urlToDownload, `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`);
  };

  const handleDownloadBatchFormat = (formatType: 'pdf' | 'zpl' | 'epl' | 'pdfZip' | 'zplZip' | 'eplZip') => {
    if (!batchResult?.consolidatedLabelUrls) {
      toast.error('Batch labels not available.');
      return;
    }
    const urls = batchResult.consolidatedLabelUrls;
    let url: string | undefined;
    let downloadName: string;
    let formatName: string;

    switch (formatType) {
      case 'pdf':
        url = urls.pdf;
        formatName = 'Batch PDF';
        downloadName = `batch_labels_${batchResult.batchId}.pdf`;
        break;
      case 'zpl':
        url = urls.zpl;
        formatName = 'Batch ZPL';
        downloadName = `batch_labels_${batchResult.batchId}.zpl`;
        break;
      case 'epl':
        url = urls.epl;
        formatName = 'Batch EPL';
        downloadName = `batch_labels_${batchResult.batchId}.epl`;
        break;
      case 'pdfZip':
        url = urls.pdfZip;
        formatName = 'Batch PDF (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_pdfs.zip`;
        break;
      case 'zplZip':
        url = urls.zplZip;
        formatName = 'Batch ZPL (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_zpls.zip`;
        break;
      case 'eplZip':
        url = urls.eplZip;
        formatName = 'Batch EPL (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_epls.zip`;
        break;
      default:
        toast.error(`Unknown batch format type: ${formatType}`);
        return;
    }

    if (!url) {
      toast.error(`${formatName} not available.`);
      return;
    }

    downloadFile(url, downloadName);
  };

  const handleDownloadAllBatchLabels = () => {
    if (!batchResult?.consolidatedLabelUrls) {
      toast.error('No batch labels available for download.');
      return;
    }

    const { pdfZip, zplZip, eplZip, pdf } = batchResult.consolidatedLabelUrls;

    // Prioritize PDF ZIP, then ZPL ZIP, then EPL ZIP, then single PDF
    if (pdfZip) {
      downloadFile(pdfZip, `batch_labels_${batchResult.batchId}_all_labels.zip`);
    } else if (zplZip) {
      downloadFile(zplZip, `batch_labels_${batchResult.batchId}_all_zpls.zip`);
    } else if (eplZip) {
      downloadFile(eplZip, `batch_labels_${batchResult.batchId}_all_epls.zip`);
    } else if (pdf) {
      downloadFile(pdf, `batch_labels_${batchResult.batchId}.pdf`);
    } else {
      toast.error('No consolidated or ZIP batch label formats available for download.');
    }
  };

  const handleDownloadManifest = () => {
    if (!batchResult?.scanFormUrl) {
      toast.error('Manifest not available');
      return;
    }
    downloadFile(batchResult.scanFormUrl, `manifest_${batchResult.batchId}.pdf`);
  };

  const hasIndividualDownloadFormats = !isBatchPreview && labelUrls && (labelUrls.png || labelUrls.pdf || labelUrls.zpl || labelUrl);
  const hasBatchDownloads = isBatchPreview && batchResult?.consolidatedLabelUrls &&
    (batchResult.consolidatedLabelUrls.pdf || batchResult.consolidatedLabelUrls.zpl || batchResult.consolidatedLabelUrls.epl ||
      batchResult.consolidatedLabelUrls.pdfZip || batchResult.consolidatedLabelUrls.zplZip || batchResult.consolidatedLabelUrls.eplZip);

  const isPdfDownloadAvailable = isBatchPreview
    ? !!batchResult?.consolidatedLabelUrls?.pdf
    : (!!labelUrls?.pdf || (labelUrl && labelUrl.endsWith('.pdf')));

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-2">
          {/* Button for direct PDF Download */}
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={isBatchPreview ? () => handleDownloadBatchFormat('pdf') : () => handleDownloadIndividualFormat('pdf')}
            disabled={!isPdfDownloadAvailable}
          >
            <Download className="h-3 w-3 mr-1" />
            Download Label
          </Button>
          {/* Button to open the Print Preview Dialog */}
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
              <Eye className="h-3 w-3 mr-1" />
              Print Preview
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-white m-4">
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
              onClick={() => setIsOpen(false)}
              className="rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'preview' && (
              <>
                {/* Format selector - Full width */}
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
                          {labelFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value} className="hover:bg-gray-50 p-4">
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex-1">
                                  <div className="font-medium text-base">{format.label}</div>
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

                {/* Full screen preview */}
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

                {/* Download button at bottom */}
                <div className="p-4 bg-white border-t">
                  <div className="flex justify-center">
                    <Button
                      onClick={handleDownload}
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
                    <div className="border rounded-lg p-4 text-center hover:border-green-300 transition-colors bg-white">
                      <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                      <h4 className="font-medium mb-2">PNG Format</h4>
                      <p className="text-xs text-gray-500 mb-4">
                        High-quality image format. Perfect for most standard printers and email attachments.
                      </p>
                      <Button
                        onClick={() => handleDownloadIndividualFormat('png')}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!(labelUrls?.png || labelUrl)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 text-center hover:border-blue-300 transition-colors bg-white">
                      <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                      <h4 className="font-medium mb-2">PDF Format</h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Professional document format. Ideal for printing and archiving shipment records.
                      </p>
                      <Button
                        onClick={() => handleDownloadIndividualFormat('pdf')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!(labelUrls?.pdf || labelUrl)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 text-center hover:border-purple-300 transition-colors bg-white">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                      <h4 className="font-medium mb-2">ZPL Format</h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Zebra Programming Language. Optimized for thermal label printers and industrial use.
                      </p>
                      <Button
                        onClick={() => handleDownloadIndividualFormat('zpl')}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!labelUrls?.zpl}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download ZPL
                      </Button>
                    </div>
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

export default PrintPreview;
