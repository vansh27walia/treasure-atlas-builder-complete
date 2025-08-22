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
  { value: '8.5x11-top', label: '8.5x11" - Top', description: 'Convert to horizontal and place at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Bottom', description: 'Convert to horizontal and place at bottom of letter page' }
];

// Normal shipping formats - simpler version
const normalShippingFormats = [
  { value: '4x6', label: '4x6" Thermal', description: 'Keep original 4x6 size as-is' },
  { value: '8.5x11-2-labels', label: '8.5x11" - 2 Labels', description: 'Convert labels to horizontal format on letter page' }
];

// Consolidated label formats - for batch labels
const consolidatedLabelFormats = [
  { value: '8.5x11-2-labels', label: '8.5x11" - 2 Labels per Sheet', description: 'Keep entire sheets as-is but rotate to vertical orientation' },
  { value: '4x6-individual', label: '4x6" Individual Pages', description: 'Each label on separate 4x6 page from individual label URLs' },
  { value: 'pdf2-merged', label: 'PDF2 - Merged Individual Labels', description: 'All individual labels merged into single PDF file' }
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
    if (isNormalShipping) return '4x6';
    if (isConsolidated) return '8.5x11-2-labels';
    return '4x6';
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

  // For individual labels - handle format conversion
  const generateIndividualLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const originalPage = originalPdf.getPage(0);
    const embeddedPage = await outputPdf.embedPage(originalPage);

    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 432;   // 6" horizontal (rotated from 4x6)
    const labelHeight = 288;  // 4" horizontal (rotated from 4x6)

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
      // Convert vertical label to horizontal and place at top
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Draw the label horizontally at top (rotated 90 degrees)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 50,
        width: labelWidth, 
        height: labelHeight,
        rotate: degrees(90)
      });
    } else if (layoutOption === '8.5x11-bottom') {
      // Convert vertical label to horizontal and place at bottom
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Draw the label horizontally at bottom (rotated 90 degrees)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 50,
        width: labelWidth, 
        height: labelHeight,
        rotate: degrees(90)
      });
    }

    return await outputPdf.save();
  };

  // For normal shipping labels
  const generateNormalShippingPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    if (layoutOption === '4x6') {
      // Keep original as-is
      const originalPage = originalPdf.getPage(0);
      const embeddedPage = await outputPdf.embedPage(originalPage);
      const page = outputPdf.addPage([288, 432]); // 4x6 vertical
      page.drawPage(embeddedPage, { 
        x: 0, 
        y: 0, 
        width: 288, 
        height: 432 
      });
    } else if (layoutOption === '8.5x11-2-labels') {
      // Create 8.5x11 with 2 labels horizontally oriented
      const originalPage = originalPdf.getPage(0);
      const embeddedPage = await outputPdf.embedPage(originalPage);
      
      const letterWidth = 612;  // 8.5"
      const letterHeight = 792; // 11"
      const labelWidth = 288;   // 4" horizontal
      const labelHeight = 432;  // 6" horizontal
      
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Draw first label at top (rotated to horizontal)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelHeight) / 2, 
        y: letterHeight - labelWidth - 50,
        width: labelHeight, 
        height: labelWidth,
        rotate: degrees(90)
      });
      
      // Draw another copy at bottom (rotated to horizontal)
      page.drawPage(embeddedPage, { 
        x: (letterWidth - labelHeight) / 2, 
        y: 50,
        width: labelHeight, 
        height: labelWidth,
        rotate: degrees(90)
      });
    }

    return await outputPdf.save();
  };

  // For consolidated labels - handle different formatting options
  const generateConsolidatedLabelPDF = async (layoutOption: string): Promise<Uint8Array> => {
    if (!originalPdfBytes) {
      throw new Error('No PDF data available for consolidated labels');
    }

    const originalPdf = await PDFDocument.load(originalPdfBytes);
    const outputPdf = await PDFDocument.create();

    if (layoutOption === '8.5x11-2-labels') {
      // Keep all sheets as-is but rotate to vertical (portrait) orientation
      for (let i = 0; i < originalPdf.getPageCount(); i++) {
        const originalPage = originalPdf.getPage(i);
        const embeddedPage = await outputPdf.embedPage(originalPage);
        
        // Get original page dimensions
        const { width: origWidth, height: origHeight } = originalPage.getSize();
        
        // Create vertical page (portrait) - ensure it's vertical
        const page = outputPdf.addPage([Math.min(origWidth, origHeight), Math.max(origWidth, origHeight)]);
        
        // If original is landscape, rotate to portrait
        if (origWidth > origHeight) {
          page.drawPage(embeddedPage, {
            x: 0,
            y: Math.max(origWidth, origHeight),
            width: Math.max(origWidth, origHeight),
            height: Math.min(origWidth, origHeight),
            rotate: degrees(90)
          });
        } else {
          // Already portrait, keep as-is
          page.drawPage(embeddedPage, {
            x: 0,
            y: 0,
            width: origWidth,
            height: origHeight
          });
        }
      }
    } else if (layoutOption === '4x6-individual') {
      // Create individual 4x6 pages from each label
      if (isConsolidated && consolidatedLabels.length > 0) {
        // Use individual label URLs if available
        for (const label of consolidatedLabels) {
          if (label.labelUrl || label.label_urls?.pdf || label.label_url) {
            try {
              const labelUrl = label.labelUrl || label.label_urls?.pdf || label.label_url;
              const response = await fetch(labelUrl);
              const arrayBuffer = await response.arrayBuffer();
              const labelPdf = await PDFDocument.load(arrayBuffer);
              const labelPage = labelPdf.getPage(0);
              const embeddedPage = await outputPdf.embedPage(labelPage);

              // Create 4x6 page for each label (keep as-is)
              const page = outputPdf.addPage([288, 432]); // 4x6 vertical
              page.drawPage(embeddedPage, {
                x: 0,
                y: 0,
                width: 288,
                height: 432
              });
            } catch (error) {
              console.error('Error processing individual label:', error);
            }
          }
        }
      }
    } else if (layoutOption === 'pdf2-merged') {
      // Merge all individual PDFs into one
      if (isConsolidated && consolidatedLabels.length > 0) {
        for (const label of consolidatedLabels) {
          if (label.labelUrl || label.label_urls?.pdf || label.label_url) {
            try {
              const labelUrl = label.labelUrl || label.label_urls?.pdf || label.label_url;
              const response = await fetch(labelUrl);
              const arrayBuffer = await response.arrayBuffer();
              const labelPdf = await PDFDocument.load(arrayBuffer);
              
              // Copy all pages from this PDF
              for (let i = 0; i < labelPdf.getPageCount(); i++) {
                const labelPage = labelPdf.getPage(i);
                const embeddedPage = await outputPdf.embedPage(labelPage);
                const { width, height } = labelPage.getSize();
                
                const page = outputPdf.addPage([width, height]);
                page.drawPage(embeddedPage, {
                  x: 0,
                  y: 0,
                  width: width,
                  height: height
                });
              }
            } catch (error) {
              console.error('Error processing PDF for merge:', error);
            }
          }
        }
      }
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
      
      if (isNormalShipping) {
        pdfBytes = await generateNormalShippingPDF(originalPdfBytes!, format);
      } else if (isConsolidated) {
        pdfBytes = await generateConsolidatedLabelPDF(format);
      } else {
        pdfBytes = await generateIndividualLabelPDF(originalPdfBytes!, format);
      }
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (currentPreviewUrl && currentPreviewUrl !== labelUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
      
      const availableFormats = isNormalShipping ? normalShippingFormats : 
                              isConsolidated ? consolidatedLabelFormats : 
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
        // Use current preview URL for PDF (with formatting applied)
        const downloadUrl = currentPreviewUrl || labelUrl;
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        // Special filename for PDF2
        if (selectedFormat === 'pdf2-merged') {
          filename = `shipping_labels_merged_pdf2_${Date.now()}.pdf`;
        } else {
          filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
        }
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
      
      const formatName = selectedFormat === 'pdf2-merged' ? 'PDF2 Merged' : format.toUpperCase();
      toast.success(`Downloaded ${formatName} label`);
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

  const availableFormats = isNormalShipping ? normalShippingFormats : 
                          isConsolidated ? consolidatedLabelFormats : 
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

      <DialogContent className="max-w-7xl bg-white sm:rounded-lg h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
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

        <div className="flex-1 flex flex-col pt-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full h-9 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                    {availableFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer py-3 hover:bg-gray-50 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 p-4 bg-gray-50 border rounded-lg overflow-hidden">
                <div className="mb-3 text-center">
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {availableFormats.find(f => f.value === selectedFormat)?.label} format...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Preview: {availableFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}
                    </p>
                  )}
                </div>
                
                <div className="mx-auto bg-white p-3 shadow-lg rounded-lg w-full" style={{ height: 'calc(100% - 60px)' }}>
                  {isGenerating ? (
                    <div className="border border-gray-300 h-full flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                        <p className="text-purple-800">Generating label format...</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={`${currentPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border border-gray-300 rounded-lg"
                      title="Label Preview"
                      style={{ minHeight: '500px' }}
                    />
                  ) : (
                    <div className="border border-gray-300 h-full flex items-center justify-center text-gray-500 rounded-lg">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Loading label preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <Button
                  onClick={handlePrint}
                  disabled={isGenerating || !currentPreviewUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div 
                  className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-blue-500 bg-blue-50 hover:bg-blue-100"
                  onClick={() => handleDownload('pdf')}
                >
                  <File className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h4 className="font-bold text-lg mb-2">
                    {selectedFormat === 'pdf2-merged' ? 'PDF2 Format' : 'PDF Format'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedFormat === 'pdf2-merged' ? 'Merged individual labels' : 'Best for printing and archiving'}
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10">
                    <Download className="h-4 w-4 mr-2" />
                    {selectedFormat === 'pdf2-merged' ? 'Download PDF2' : 'Download PDF'}
                  </Button>
                </div>
                
                <div 
                  className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-green-500 bg-green-50 hover:bg-green-100"
                  onClick={() => handleDownload('png')}
                >
                  <FileImage className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  <h4 className="font-bold text-lg mb-2">PNG Format</h4>
                  <p className="text-sm text-gray-600 mb-4">Image format for viewing</p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-10">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>
                
                <div 
                  className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-purple-500 bg-purple-50 hover:bg-purple-100"
                  onClick={() => handleDownload('zpl')}
                >
                  <FileArchive className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                  <h4 className="font-bold text-lg mb-2">ZPL Format</h4>
                  <p className="text-sm text-gray-600 mb-4">For thermal printers</p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-10">
                    <Download className="h-4 w-4 mr-2" />
                    Download ZPL
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6 max-w-xl mx-auto">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email Addresses</Label>
                  <div className="space-y-3">
                    {emailList.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) => updateEmailField(index, e.target.value)}
                          className="flex-1 h-10"
                        />
                        {emailList.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmailField(index)}
                            className="text-red-600 hover:text-red-700 h-10 w-10"
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
                    className="mt-3 h-10"
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
                    className="h-10"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Format</Label>
                  <Select value={emailFormat} onValueChange={setEmailFormat}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="zpl">ZPL</SelectItem>
                      {selectedFormat === 'pdf2-merged' && (
                        <SelectItem value="pdf2">PDF2 (Merged)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSendEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold"
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
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-10 px-6">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPrintPreview;
