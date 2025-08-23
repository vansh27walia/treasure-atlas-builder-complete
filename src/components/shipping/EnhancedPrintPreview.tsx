import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, X, Loader2, Eye, File, FileImage, FileArchive, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFDocument, degrees } from 'pdf-lib';

// Individual label formats - for single labels
const individualLabelFormats = [
  { value: '4x6', label: '4x6" Thermal', description: 'Keep original 4x6 size as-is' },
  { value: '8.5x11-top', label: '8.5x11" - Top', description: 'Convert to vertical and place at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Bottom', description: 'Convert to vertical and place at bottom of letter page' }
];

// Normal shipping formats - simpler version
const normalShippingFormats = [
  { value: '4x6', label: '4x6" Thermal', description: 'Keep original 4x6 size as-is' },
  { value: '8.5x11-top', label: '8.5x11" - Top', description: 'Convert to vertical and place at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Bottom', description: 'Convert to vertical and place at bottom of letter page' }
];

// Consolidated label formats - for batch labels (simplified to single option)
const consolidatedLabelFormats = [
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

  // Set default format based on type
  const getDefaultFormat = () => {
    if (isConsolidated) return '8.5x11-as-is'; // Simplified for consolidated
    return '4x6'; // Default for individual and normal shipping
  };

  const [selectedFormat, setSelectedFormat] = useState(getDefaultFormat());
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');
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

  // For individual labels - handle format conversion with vertical orientation
  const generateIndividualLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const originalPage = originalPdf.getPage(0);
    const embeddedPage = await outputPdf.embedPage(originalPage);

    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 288;   // 4" vertical (original height becomes width)
    const labelHeight = 432;  // 6" vertical (original width becomes height)

    if (layoutOption === '4x6') {
      // Keep 4x6 as-is, no conversion needed
      const page = outputPdf.addPage([288, 432]); // 4x6 vertical
      page.drawPage(embeddedPage, { 
        x: 0, 
        y: 0, 
        width: 288, 
        height: 432 
      });
    } else if (layoutOption === '8.5x11-top') {
      // Convert to vertical and place at top
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Draw the label vertically at top (no rotation needed, just positioning)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 50,
        width: labelWidth, 
        height: labelHeight
      });
    } else if (layoutOption === '8.5x11-bottom') {
      // Convert to vertical and place at bottom
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Draw the label vertically at bottom (no rotation needed, just positioning)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 50,
        width: labelWidth, 
        height: labelHeight
      });
    }

    return await outputPdf.save();
  };

  // For consolidated labels - display as-is from backend
  const generateConsolidatedLabelPDF = async (layoutOption: string): Promise<Uint8Array> => {
    if (!originalPdfBytes) {
      throw new Error('No PDF data available for consolidated labels');
    }

    // For consolidated labels, always return as-is from backend
    return originalPdfBytes;
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
        pdfBytes = await generateConsolidatedLabelPDF(format);
      } else {
        // For individual and normal shipping labels
        pdfBytes = await generateIndividualLabelPDF(originalPdfBytes!, format);
      }
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (currentPreviewUrl && currentPreviewUrl !== labelUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
      
      const availableFormats = isConsolidated ? consolidatedLabelFormats : 
                              isNormalShipping ? normalShippingFormats : 
                              individualLabelFormats;
      
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
      let blob: Blob;
      let filename: string;
      
      if (format === 'pdf') {
        // Use current preview URL for PDF (with formatting applied) or fallback to original
        const downloadUrl = currentPreviewUrl || labelUrl;
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
      } else {
        // For PNG and ZPL, use original URL
        const response = await fetch(labelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${format.toUpperCase()}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const mimeType = format === 'png' ? 'image/png' : 'text/plain';
        blob = new Blob([arrayBuffer], { type: mimeType });
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
      toast.info('Email functionality requires backend setup. Labels will be sent in the selected format.');
    }
  };

  const availableFormats = isConsolidated ? consolidatedLabelFormats : 
                          isNormalShipping ? normalShippingFormats : 
                          individualLabelFormats;
  
  const dialogTitleText = isConsolidated 
    ? `Print Preview - All Labels (${consolidatedLabels.length} labels)`
    : isNormalShipping
    ? `Print Preview - Normal Shipping`
    : `Print Preview - ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : (
        <div className="flex gap-3">
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
          {isConsolidated && onEmailLabels && (
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
              onClick={onEmailLabels}
            >
              <Mail className="h-3 w-3 mr-1" />
              Email All Labels
            </Button>
          )}
        </div>
      )}

      <DialogContent className="max-w-4xl bg-white sm:rounded-lg h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center justify-between pr-6 text-lg">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-3 h-9">
              <TabsTrigger value="preview" className="text-sm py-1">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="text-sm py-1">
                <Download className="h-4 w-4 mr-1" />
                Download
              </TabsTrigger>
              <TabsTrigger value="email" className="text-sm py-1">
                <Mail className="h-4 w-4 mr-1" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col overflow-hidden">
              {/* Format Selection - Only show if not consolidated or has options */}
              {!isConsolidated && (
                <div className="mb-3">
                  <Label className="text-sm font-medium mb-1 block">Print Format</Label>
                  <Select
                    value={selectedFormat}
                    onValueChange={handleFormatChange}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="w-full h-8 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 text-sm">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60] max-h-[180px] overflow-y-auto">
                      {availableFormats.map(format => (
                        <SelectItem key={format.value} value={format.value} className="cursor-pointer py-2 hover:bg-gray-50 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{format.label}</span>
                            <span className="text-xs text-gray-500">{format.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Compact Preview Section */}
              <div className="flex-1 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                <div className="mb-3 text-center">
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">Generating {availableFormats.find(f => f.value === selectedFormat)?.label} format...</span>
                    </div>
                  ) : (
                    <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border text-xs">
                      <p className="text-gray-700 font-medium">
                        {isConsolidated ? 'Consolidated Labels - As received from backend' : 
                         `Preview: ${availableFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}`}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Compact Preview Container */}
                <div className="mx-auto bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
                  {isGenerating ? (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <div className="flex flex-col items-center p-6">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                        <p className="text-blue-800 font-semibold">Generating label format...</p>
                        <p className="text-gray-600 text-sm mt-1">Please wait while we prepare your label</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={`${currentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full h-full border-0"
                      title="Label Preview"
                      style={{ minHeight: '400px' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
                      <div className="text-center p-6">
                        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Loading label preview...</p>
                        <p className="text-sm text-gray-400 mt-1">Please wait while we prepare your label</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Print Button */}
              <div className="pt-3 border-t mt-3 bg-white rounded-md">
                <Button
                  onClick={handlePrint}
                  disabled={isGenerating || !currentPreviewUrl}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-10 font-semibold text-sm rounded-lg shadow-md transform transition-all hover:scale-105 disabled:transform-none disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div 
                  className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-blue-500 bg-blue-50 hover:bg-blue-100"
                  onClick={() => handleDownload('pdf')}
                >
                  <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold text-lg mb-2">PDF Format</h4>
                  <p className="text-sm text-gray-600 mb-3">Best for printing and archiving</p>
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
                  <h4 className="font-semibold text-lg mb-2">PNG Format</h4>
                  <p className="text-sm text-gray-600 mb-3">Image format for viewing</p>
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
                  <h4 className="font-semibold text-lg mb-2">ZPL Format</h4>
                  <p className="text-sm text-gray-600 mb-3">For thermal printers</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Download ZPL
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4 max-w-xl mx-auto">
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

        <DialogFooter className="sm:justify-start pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-9 px-6">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPrintPreview;
