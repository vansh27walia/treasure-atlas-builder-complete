
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, X, Loader2, Eye, File, FileImage, FileArchive, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

// Format options for individual/normal shipping labels
const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-top', label: '8.5x11" - 1 Shipping Label per Page - Top', description: 'One 4x6" label at the top of a letter-sized page' },
  { value: '8.5x11-bottom', label: '8.5x11" - 1 Shipping Label per Page - Bottom', description: 'One 4x6" label at the bottom of a letter-sized page' }
];

// Consolidated format (single option for batch)
const consolidatedFormats = [
  { value: '8.5x11-as-is', label: '8.5x11" - As-Is from Backend', description: 'Display sheets exactly as received from backend without any modifications' }
];

interface EnhancedPrintPreviewProps {
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
  shipmentId?: string;
  isConsolidated?: boolean;
  isNormalShipping?: boolean;
  consolidatedLabels?: any[];
  onEmailLabels?: () => void;
}

const EnhancedPrintPreview: React.FC<EnhancedPrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentDetails,
  shipmentId,
  isConsolidated = false,
  isNormalShipping = false,
  consolidatedLabels = [],
  onEmailLabels
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

  const [selectedFormat, setSelectedFormat] = useState(isConsolidated ? '8.5x11-as-is' : '4x6');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && labelUrl && !originalPdfBytes) {
      loadOriginalPdf();
    }
  }, [isOpen, labelUrl]);

  const loadOriginalPdf = async () => {
    try {
      console.log('Loading PDF from URL:', labelUrl);
      const response = await fetch(labelUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setOriginalPdfBytes(bytes);
      setCurrentPreviewUrl(labelUrl);
      console.log('PDF loaded successfully');
    } catch (error) {
      console.error('Error loading original PDF:', error);
      toast.error('Failed to load label PDF');
    }
  };

  // Generate individual label PDF with vertical orientation for 8.5x11 formats
  const generateIndividualLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const originalPage = originalPdf.getPage(0);
    const embeddedPage = await outputPdf.embedPage(originalPage);

    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 288;   // 4" (vertical orientation)
    const labelHeight = 432;  // 6" (vertical orientation)

    if (layoutOption === '4x6') {
      // Keep 4x6 as-is from backend
      const page = outputPdf.addPage([288, 432]); // 4x6 vertical
      page.drawPage(embeddedPage, { 
        x: 0, 
        y: 0, 
        width: 288, 
        height: 432 
      });
    } else if (layoutOption === '8.5x11-top') {
      // Place vertical label at top of letter page
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 50,
        width: labelWidth, 
        height: labelHeight
      });
    } else if (layoutOption === '8.5x11-bottom') {
      // Place vertical label at bottom of letter page
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 50,
        width: labelWidth, 
        height: labelHeight
      });
    }

    return await outputPdf.save();
  };

  const handleFormatChange = async (format: string) => {
    if (!originalPdfBytes) {
      toast.error('Original PDF not loaded');
      return;
    }

    setSelectedFormat(format);
    setIsGenerating(true);

    try {
      let pdfBytes: Uint8Array;
      
      if (isConsolidated) {
        // For consolidated labels, always show as-is from backend
        pdfBytes = originalPdfBytes;
      } else {
        // For individual and normal shipping labels
        pdfBytes = await generateIndividualLabelPDF(originalPdfBytes, format);
      }
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (currentPreviewUrl && currentPreviewUrl !== labelUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
      
      const availableFormats = isConsolidated ? consolidatedFormats : labelFormats;
      const formatLabel = availableFormats.find(f => f.value === format)?.label;
      
      toast.success(`Label format updated to ${formatLabel}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate label format');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    try {
      // Use the correct backend URL (labelUrl) for download
      const downloadUrl = labelUrl;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${format.toUpperCase()}: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const mimeType = format === 'pdf' ? 'application/pdf' : 
                      format === 'png' ? 'image/png' : 'text/plain';
      const blob = new Blob([arrayBuffer], { type: mimeType });
      
      const filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success(`Downloaded ${format.toUpperCase()} label successfully`);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download label');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        toast.success('Print dialog opened');
      } catch (error) {
        console.error("Error printing PDF:", error);
        if (currentPreviewUrl) {
          const printWindow = window.open(currentPreviewUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        }
        toast.error("Print dialog issue. Opening in new window...");
      }
    } else {
      toast.error("Print preview not available");
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
    
    if (onEmailLabels) {
      onEmailLabels();
    } else {
      toast.success(`Email will be sent to ${validEmails.length} recipient(s) in ${emailFormat.toUpperCase()} format`);
    }
    setEmailModalOpen(false);
  };

  const handleEmailButtonClick = () => {
    setEmailModalOpen(true);
  };

  const availableFormats = isConsolidated ? consolidatedFormats : labelFormats;
  
  const dialogTitleText = isConsolidated 
    ? `Print Preview - All Labels (${consolidatedLabels.length} labels)`
    : isNormalShipping
    ? `Print Preview - Normal Shipping`
    : `Print Preview - ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {triggerButton ? (
          <DialogTrigger asChild>
            {triggerButton}
          </DialogTrigger>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
              onClick={() => handleDownload('pdf')}
            >
              <Download className="h-3 w-3 mr-1" />
              Download PDF
            </Button>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
                <Eye className="h-3 w-3 mr-1" />
                Print Preview
              </Button>
            </DialogTrigger>
          </div>
        )}

        <DialogContent className="max-w-5xl bg-white sm:rounded-lg h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between pr-6 text-lg font-semibold">
              <span>{dialogTitleText}</span>
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-3 h-9">
                <TabsTrigger value="preview" className="text-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="download" className="text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </TabsTrigger>
                <TabsTrigger value="email" className="text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 flex flex-col overflow-hidden">
                {/* Format Selection - Only show for non-consolidated labels */}
                {!isConsolidated && (
                  <div className="mb-3">
                    <Label className="text-sm font-medium mb-1 block">Print Format</Label>
                    <Select
                      value={selectedFormat}
                      onValueChange={handleFormatChange}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full h-9 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60]">
                        {availableFormats.map(format => (
                          <SelectItem key={format.value} value={format.value} className="cursor-pointer py-2 hover:bg-gray-50">
                            <div className="flex flex-col py-1">
                              <span className="font-medium text-sm">{format.label}</span>
                              <span className="text-xs text-gray-500">{format.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* PDF Preview Section */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50 border-b border-gray-200 text-center">
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-blue-800 font-medium text-sm">Generating {availableFormats.find(f => f.value === selectedFormat)?.label} format...</span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p className="text-gray-700 font-medium">
                          {isConsolidated ? 'Consolidated Labels - As received from backend' : 
                           `Preview: ${availableFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}`}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* PDF Preview Container */}
                  <div className="h-full overflow-hidden bg-gray-50" style={{ height: 'calc(100% - 41px)' }}>
                    {isGenerating ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center p-4">
                          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
                          <p className="text-blue-800 font-semibold text-sm">Generating label format...</p>
                        </div>
                      </div>
                    ) : currentPreviewUrl ? (
                      <iframe 
                        ref={iframeRef} 
                        src={`${currentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100`}
                        className="w-full h-full border-0"
                        title="Label Preview"
                        style={{ 
                          minHeight: '400px',
                          transform: selectedFormat === '4x6' ? 'scale(0.8)' : 'scale(0.9)',
                          transformOrigin: 'top center'
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center p-4">
                          <Eye className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="font-medium text-sm">Loading label preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Button */}
                <div className="pt-3 border-t mt-3">
                  <Button
                    onClick={handlePrint}
                    disabled={isGenerating || !currentPreviewUrl}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-10 font-semibold rounded-lg shadow-md"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Label
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="download" className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-blue-500 bg-blue-50 hover:bg-blue-100"
                    onClick={() => handleDownload('pdf')}
                  >
                    <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                    <h4 className="font-semibold text-lg mb-2">PDF Format</h4>
                    <p className="text-sm text-gray-600 mb-3">Professional document format. Ideal for printing and archiving shipment records.</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-green-500 bg-green-50 hover:bg-green-100"
                    onClick={() => handleDownload('png')}
                  >
                    <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <h4 className="font-semibold text-lg mb-2">PNG Format</h4>
                    <p className="text-sm text-gray-600 mb-3">High-quality image format. Perfect for most standard printers and email attachments.</p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                  </div>
                  
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-lg border-purple-500 bg-purple-50 hover:bg-purple-100"
                    onClick={() => handleDownload('zpl')}
                  >
                    <FileArchive className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                    <h4 className="font-semibold text-lg mb-2">ZPL Format</h4>
                    <p className="text-sm text-gray-600 mb-3">Zebra Programming Language. Optimized for thermal label printers and industrial use.</p>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download ZPL
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-4 max-w-2xl mx-auto">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Email Addresses</Label>
                    <div className="space-y-2">
                      {emailList.map((email, index) => (
                        <div key={index} className="flex gap-2">
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
                              className="text-red-600 hover:text-red-700 h-9 w-9"
                            >
                              <Trash2 className="h-4 w-4" />
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
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal that auto-opens */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-md bg-white sm:rounded-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-semibold">Email Label</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 rounded-sm opacity-70"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="space-y-3 p-2">
            <div>
              <Label className="text-sm font-medium mb-1 block">Email Addresses</Label>
              <div className="space-y-2">
                {emailList.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => updateEmailField(index, e.target.value)}
                      className="flex-1 h-8"
                    />
                    {emailList.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeEmailField(index)}
                        className="text-red-600 hover:text-red-700 h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addEmailField}
                className="mt-2 h-8 text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Email
              </Button>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Subject</Label>
              <Input
                type="text"
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1 block">Format</Label>
              <Select value={emailFormat} onValueChange={setEmailFormat}>
                <SelectTrigger className="h-8">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 font-semibold"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedPrintPreview;
