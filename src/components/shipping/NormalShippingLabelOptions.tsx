
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, Mail, Plus, Trash2, Eye, Files, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

// Utility function to construct Supabase storage URLs
const getSupabaseStorageUrl = (filename: string, format: 'pdf' | 'png' | 'zpl') => {
  const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/shipping-labels/labels';
  const filenameParts = filename.split('.');
  const baseName = filenameParts[0];
  return `${baseUrl}/${baseName}.${format}`;
};

// Type definitions for clarity and consistency
interface ConsolidatedLabelUrls {
  png?: string;
  pdf?: string;
  zpl?: string;
}

interface PrintPreviewProps {
  children?: React.ReactNode;
  triggerButton?: React.ReactNode;
  isOpenProp?: boolean;
  onOpenChangeProp?: (open: boolean) => void;
  labelUrl: string; // The primary label URL, usually the PDF
  trackingCode: string | null;
  shipmentId?: string;
  labelUrls?: ConsolidatedLabelUrls;
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: ConsolidatedLabelUrls;
    scanFormUrl: string | null;
  };
  isBatchPreview?: boolean;
  initialTab?: 'preview' | 'download' | 'email';
}

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Single horizontal label per page' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)', description: 'One horizontal label at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)', description: 'One horizontal label at bottom of letter page' }
];

const PrintPreview: React.FC<PrintPreviewProps> = ({
  children,
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentId,
  labelUrls,
  batchResult,
  isBatchPreview = false,
  initialTab = 'preview'
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('placeholder');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');

  // Load the initial preview URL and type based on props
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab);
    let url = isBatchPreview
      ? batchResult?.consolidatedLabelUrls?.pdf
      : labelUrls?.pdf || labelUrl;

    // Ensure we're using proper Supabase storage URLs
    if (!url && labelUrl) {
      // Extract filename from the labelUrl and construct proper Supabase URL
      const filename = labelUrl.split('/').pop() || '';
      url = getSupabaseStorageUrl(filename, 'pdf');
    } else if (url && !url.includes('adhegezdzqlnqqnymvps.supabase.co')) {
      // If we have a URL but it's not from the correct Supabase storage, reconstruct it
      const filename = url.split('/').pop() || '';
      url = getSupabaseStorageUrl(filename, 'pdf');
    }

    if (url) {
      setCurrentPreviewUrl(url);
      setPreviewType(url.endsWith('.png') ? 'image' : 'pdf');
      setSelectedFormat('4x6'); // Reset format for consistency
    } else {
      setCurrentPreviewUrl('');
      setPreviewType('placeholder');
    }
  }, [isOpen, initialTab, isBatchPreview, batchResult, labelUrls, labelUrl]);

  // Handle PDF format change and preview generation
  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);
    
    try {
      let originalUrl = isBatchPreview
        ? batchResult?.consolidatedLabelUrls?.pdf
        : labelUrls?.pdf || labelUrl;

      // Ensure we're using proper Supabase storage URLs
      if (!originalUrl && labelUrl) {
        const filename = labelUrl.split('/').pop() || '';
        originalUrl = getSupabaseStorageUrl(filename, 'pdf');
      } else if (originalUrl && !originalUrl.includes('adhegezdzqlnqqnymvps.supabase.co')) {
        const filename = originalUrl.split('/').pop() || '';
        originalUrl = getSupabaseStorageUrl(filename, 'pdf');
      }

      if (!originalUrl) {
        throw new Error('Original PDF URL not found.');
      }

      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch original PDF: ${response.status}`);
      }
      const originalPdfBytes = await response.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalPdfBytes);
      const outputPdf = await PDFDocument.create();

      const letterWidth = 612; // 8.5"
      const letterHeight = 792; // 11"
      const labelWidth = 432;   // 6" horizontal
      const labelHeight = 288;  // 4" horizontal

      for (let i = 0; i < originalPdf.getPageCount(); i++) {
        const originalPage = originalPdf.getPage(i);
        const embeddedPage = await outputPdf.embedPage(originalPage);

        let x = 0;
        let y = 0;
        let width = labelWidth;
        let height = labelHeight;
        
        const isLetter = format.startsWith('8.5x11');
        const outputPage = outputPdf.addPage(isLetter ? [letterWidth, letterHeight] : [labelWidth, labelHeight]);

        if (format === '8.5x11-top') {
          x = (letterWidth - labelWidth) / 2;
          y = letterHeight - labelHeight - 50;
        } else if (format === '8.5x11-bottom') {
          x = (letterWidth - labelWidth) / 2;
          y = 50;
        }

        outputPage.drawPage(embeddedPage, { x, y, width, height });
      }

      const formattedPdfBytes = await outputPdf.save();
      const blob = new Blob([formattedPdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      setCurrentPreviewUrl(blobUrl);
      setPreviewType('pdf');

    } catch (error) {
      console.error("Error generating label format:", error);
      toast.error("Failed to generate label preview.");
      setCurrentPreviewUrl('');
      setPreviewType('placeholder');
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const handlePrint = () => {
    if (previewType !== 'pdf' || !iframeRef.current || !iframeRef.current.contentWindow) {
      toast.error("No PDF preview available to print directly. Please download the label.");
      return;
    }

    try {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } catch (error) {
      console.error("Error printing PDF from iframe:", error);
      toast.error("Print dialog issue. Opening in new window...");
      if (currentPreviewUrl) {
        window.open(currentPreviewUrl, '_blank')?.print();
      }
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl') => {
    try {
      // Use proper Supabase storage URLs for all formats
      let url = labelUrls?.[format] || labelUrl;
      
      // If we don't have the specific format URL, construct it from the base URL
      if (!url && labelUrl) {
        // Extract filename from the labelUrl and construct proper Supabase URL
        const filename = labelUrl.split('/').pop() || '';
        url = getSupabaseStorageUrl(filename, format);
      }
      
      if (!url) {
        toast.error(`${format.toUpperCase()} format not available`);
        return;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${format.toUpperCase()}: ${response.status}`);
      }
      const blob = await response.blob();
      
      const filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success(`Downloaded ${format.toUpperCase()} label`);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download label');
    }
  };

  const addEmailField = () => setEmailList(prev => [...prev, '']);
  const removeEmailField = (index: number) => {
    if (emailList.length > 1) setEmailList(prev => prev.filter((_, i) => i !== index));
  };
  const updateEmailField = (index: number, value: string) => {
    setEmailList(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSendEmail = async () => {
    const validEmails = emailList.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }
    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }
    
    try {
      // Get the proper Supabase URL for the selected format
      let emailUrl = labelUrls?.[emailFormat as 'pdf' | 'png' | 'zpl'] || labelUrl;
      
      // If we don't have the specific format URL, construct it from the base URL
      if (!emailUrl && labelUrl) {
        const filename = labelUrl.split('/').pop() || '';
        emailUrl = getSupabaseStorageUrl(filename, emailFormat as 'pdf' | 'png' | 'zpl');
      }
      
      if (!emailUrl) {
        toast.error(`${emailFormat.toUpperCase()} format not available for email`);
        return;
      }
      
      // TODO: Implement actual email sending logic with the constructed URL
      toast.success(`Email will be sent to ${validEmails.length} recipient(s) in ${emailFormat.toUpperCase()} format`);
      console.log(`Sending email with subject "${emailSubject}" and format "${emailFormat}" to:`, validEmails);
      console.log(`Email URL: ${emailUrl}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error('Failed to prepare email');
    }
  };

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children || triggerButton ? (
        <DialogTrigger asChild>{children || triggerButton}</DialogTrigger>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={() => handleDownload('pdf')}
            disabled={!labelUrls?.pdf && !labelUrl}
          >
            <Download className="h-3 w-3 mr-1" />
            Download Label
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-green-200 hover:bg-green-50 text-green-700"
            onClick={() => {
              setActiveTab('email');
              setIsOpen(true);
            }}
            disabled={!labelUrls?.pdf && !labelUrl}
          >
            <Mail className="h-3 w-3 mr-1" />
            Email Label
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
              <Eye className="h-3 w-3 mr-1" />
              Print Preview
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="max-w-7xl bg-white sm:rounded-lg h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            disabled={isRegeneratingLabel}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col pt-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'download' | 'email')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-10">
              <TabsTrigger value="preview" className="text-sm py-2">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="text-sm py-2">
                <Download className="h-4 w-4 mr-2" />
                Download
              </TabsTrigger>
              <TabsTrigger value="email" className="text-sm py-2">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col overflow-hidden">
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Print Format</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-full h-10 bg-white border border-gray-300">
                    <SelectValue placeholder="Select Print Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer py-3">
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 p-4 bg-gray-50 border rounded-lg overflow-hidden flex flex-col justify-center items-center">
                <div className="mb-3 text-center">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat} format...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {`Preview: ${isBatchPreview ? 'Consolidated PDF' : 'Label'} (${labelFormats.find(f => f.value === selectedFormat)?.label || 'Original'})`}
                    </p>
                  )}
                </div>
                <div className={`mx-auto bg-white p-3 shadow-lg rounded-lg ${selectedFormat === '4x6' ? 'max-w-sm' : 'max-w-3xl'} w-full`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl && previewType === 'pdf' ? (
                    <iframe
                      ref={iframeRef}
                      src={currentPreviewUrl}
                      style={{
                        width: '100%',
                        height: selectedFormat === '4x6' ? '500px' : '600px',
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }}
                      title="Label Preview"
                    />
                  ) : currentPreviewUrl && previewType === 'image' ? (
                    <img src={currentPreviewUrl} alt="Shipping Label" className="max-w-full h-auto border border-gray-300 rounded-lg" />
                  ) : (
                    <div className="border border-gray-300 h-64 flex items-center justify-center text-gray-500 rounded-lg">
                      <div className="text-center">
                        <Files className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Preview not available.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <Button
                  onClick={handlePrint}
                  disabled={isRegeneratingLabel || !currentPreviewUrl || previewType !== 'pdf'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div
                  className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-blue-500 bg-blue-50 hover:bg-blue-100"
                  onClick={() => handleDownload('pdf')}
                >
                  <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold mb-2">PDF Format</h4>
                  <p className="text-sm text-gray-600 mb-3">Best for printing</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div
                  className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-green-500 bg-green-50 hover:bg-green-100"
                  onClick={() => handleDownload('png')}
                >
                  <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <h4 className="font-semibold mb-2">PNG Format</h4>
                  <p className="text-sm text-gray-600 mb-3">Image format</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>
                
                <div
                  className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-purple-500 bg-purple-50 hover:bg-purple-100"
                  onClick={() => handleDownload('zpl')}
                >
                  <FileArchive className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                  <h4 className="font-semibold mb-2">ZPL Format</h4>
                  <p className="text-sm text-gray-600 mb-3">For thermal printers</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Download ZPL
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="flex-1">
              <div className="p-4 space-y-4 max-w-xl mx-auto">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email Addresses</Label>
                  <div className="space-y-2">
                    {emailList.map((email, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) => updateEmailField(index, e.target.value)}
                          className="flex-1 h-9"
                        />
                        {emailList.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmailField(index)}
                            className="text-red-600 hover:text-red-700 h-9 w-9 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove email</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={addEmailField}
                    className="mt-2 h-9"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Email Address
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Subject</Label>
                  <Input
                    type="text"
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Format</Label>
                  <Select value={emailFormat} onValueChange={setEmailFormat}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="zpl">ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSendEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-semibold"
                  disabled={!labelUrls?.pdf && !labelUrl}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="sm:justify-start pt-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-9 px-6">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;