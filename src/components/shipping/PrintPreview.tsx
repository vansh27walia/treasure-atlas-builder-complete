
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2, Files, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ConsolidatedLabelUrls } from '@/types/shipping';
import { PDFDocument } from 'pdf-lib';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Standard thermal label size for direct printing' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels (2-up)', description: 'Two labels per page - top and bottom' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)', description: 'One label at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)', description: 'One label at bottom of letter page' }
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('placeholder');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');

  // Load and process PDF for client-side format conversion
  useEffect(() => {
    if (isBatchPreview) {
      if (batchResult?.consolidatedLabelUrls?.pdf) {
        setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
        setPreviewType('pdf');
        setSelectedFormat('8.5x11-2up');
        loadPdfBytes(batchResult.consolidatedLabelUrls.pdf);
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
    } else {
      if (labelUrls?.pdf) {
        setCurrentPreviewUrl(labelUrls.pdf);
        setPreviewType('pdf');
        loadPdfBytes(labelUrls.pdf);
      } else if (labelUrl && labelUrl.endsWith('.png')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('image');
      } else if (labelUrl && labelUrl.endsWith('.pdf')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('pdf');
        loadPdfBytes(labelUrl);
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
      setSelectedFormat('4x6');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const loadPdfBytes = async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error('Error loading PDF bytes:', error);
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();
    
    // Copy pages from original to output PDF context - this returns PDFEmbeddedPage[]
    const embeddedPages = await outputPdf.copyPages(originalPdf, [0]);
    const labelPage = embeddedPages[0]; // This is a PDFEmbeddedPage

    // Page sizes in points (72 points per inch)
    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 288;   // 4"
    const labelHeight = 432;  // 6"

    if (layoutOption === '4x6') {
      const page = outputPdf.addPage([labelWidth, labelHeight]);
      page.drawPage(labelPage, { x: 0, y: 0, width: labelWidth, height: labelHeight });
    } else if (layoutOption === '8.5x11-2up') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,
        width: labelWidth, 
        height: labelHeight 
      });
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,
        width: labelWidth, 
        height: labelHeight 
      });
    } else if (layoutOption === '8.5x11-top') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,
        width: labelWidth, 
        height: labelHeight 
      });
    } else if (layoutOption === '8.5x11-bottom') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,
        width: labelWidth, 
        height: labelHeight 
      });
    }

    return await outputPdf.save();
  };

  const handlePrint = () => {
    if (previewType === 'pdf' && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        setIsOpen(false);
      } catch (error) {
        console.error("Error printing PDF from iframe:", error);
        toast.error("Failed to initiate print. Please try downloading the PDF and printing it manually.");
      }
    } else {
      toast.error("No PDF preview available to print directly. Please download the label.");
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (originalPdfBytes) {
        // Client-side PDF conversion
        const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        if (currentPreviewUrl && !currentPreviewUrl.startsWith('http')) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        
        setCurrentPreviewUrl(url);
        setPreviewType('pdf');
        toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label || format}.`);
      } else if (isBatchPreview && onBatchFormatChange) {
        await onBatchFormatChange(format);
        toast.success(`Batch label format updated by server to ${format}.`);
      } else if (!isBatchPreview && onFormatChange) {
        await onFormatChange(format);
        toast.success(`Label format updated by server to ${format}.`);
      } else {
        toast.info(`Format selected: ${labelFormats.find(f => f.value === format)?.label || format}. (Server-side update not configured)`);
      }
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    try {
      let blob: Blob;
      let filename: string;
      
      if (format === 'pdf' && originalPdfBytes) {
        const pdfBytes = await generateLabelPDF(originalPdfBytes, selectedFormat);
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}_${selectedFormat}.pdf`;
      } else {
        // Fallback to direct download
        const url = labelUrls?.[format] || labelUrl;
        if (!url) {
          toast.error(`${format.toUpperCase()} format not available`);
          return;
        }
        
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { 
          type: format === 'pdf' ? 'application/pdf' : format === 'png' ? 'image/png' : 'text/plain'
        });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`;
      }
      
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

  const addEmailField = () => {
    setEmailList([...emailList, '']);
  };

  const removeEmailField = (index: number) => {
    if (emailList.length > 1) {
      setEmailList(emailList.filter((_, i) => i !== index));
    }
  };

  const updateEmailField = (index: number, value: string) => {
    const updated = [...emailList];
    updated[index] = value;
    setEmailList(updated);
  };

  const handleSendEmail = () => {
    const validEmails = emailList.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }
    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }
    
    // TODO: Implement email sending logic
    toast.success(`Email will be sent to ${validEmails.length} recipient(s) in ${emailFormat.toUpperCase()} format`);
  };

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={() => handleDownload('pdf')}
            disabled={!originalPdfBytes && !labelUrls?.pdf}
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

      <DialogContent className="max-w-6xl bg-white sm:rounded-lg h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            disabled={isRegeneratingLabel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col pt-4">
          {/* Format Selection - Full Width */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Print Format</Label>
            <Select
              value={selectedFormat}
              onValueChange={handleFormatChange}
              disabled={isRegeneratingLabel}
            >
              <SelectTrigger className="w-full h-12 bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Select Print Format" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-lg z-[9999]">
                {labelFormats.map(format => (
                  <SelectItem key={format.value} value={format.value} className="cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col py-1">
                      <span className="font-medium text-gray-900">{format.label}</span>
                      <span className="text-xs text-gray-500">{format.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for Preview/Download/Email */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col">
              <div className="flex-1 p-6 bg-gray-50 border rounded-lg">
                <div className="mb-3 text-sm text-gray-500 text-center">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat} format...</span>
                    </div>
                  ) : isBatchPreview ? (
                    `Consolidated PDF Preview for Batch (${labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat})`
                  ) : (
                    `Preview: ${labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}`
                  )}
                </div>
                <div className={`mx-auto bg-white p-2 shadow-md ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-4xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : previewType === 'pdf' && currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={currentPreviewUrl} 
                      style={{ 
                        width: '100%', 
                        height: selectedFormat === '4x6' ? '500px' : '700px', 
                        border: '1px solid #ccc' 
                      }} 
                      title="Label Preview"
                    />
                  ) : (
                    <div className="border border-gray-300 h-64 flex items-center justify-center text-gray-500">
                      {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf
                        ? 'A batch PDF is needed for preview.'
                        : previewType === 'image' && currentPreviewUrl
                          ? <img src={currentPreviewUrl} alt="Shipping Label" className="max-w-full h-auto border border-gray-300" />
                          : 'Preview not available.'
                      }
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div 
                  className="p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-blue-500 bg-blue-50"
                  onClick={() => handleDownload('pdf')}
                >
                  <File className="h-16 w-16 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold text-lg">PDF Format</h4>
                  <p className="text-sm text-gray-500 mb-3">Best for printing</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div 
                  className="p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-green-500 bg-green-50"
                  onClick={() => handleDownload('png')}
                >
                  <FileImage className="h-16 w-16 mx-auto mb-3 text-green-600" />
                  <h4 className="font-semibold text-lg">PNG Format</h4>
                  <p className="text-sm text-gray-500 mb-3">Image format</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>
                
                <div 
                  className="p-6 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-purple-500 bg-purple-50"
                  onClick={() => handleDownload('zpl')}
                >
                  <FileArchive className="h-16 w-16 mx-auto mb-3 text-purple-600" />
                  <h4 className="font-semibold text-lg">ZPL Format</h4>
                  <p className="text-sm text-gray-500 mb-3">For thermal printers</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Download ZPL
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="flex-1">
              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email Addresses</Label>
                  {emailList.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => updateEmailField(index, e.target.value)}
                        className="flex-1"
                      />
                      {emailList.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeEmailField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Subject</Label>
                  <Input
                    type="text"
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Format</Label>
                  <Select value={emailFormat} onValueChange={setEmailFormat}>
                    <SelectTrigger>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Send Email
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Bottom Print Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handlePrint}
              disabled={isRegeneratingLabel || !currentPreviewUrl}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold"
            >
              <Printer className="h-6 w-6 mr-3" />
              Print Label
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-start pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;
