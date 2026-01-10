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
import { CancelLabelDialog } from '@/components/shipping/CancelLabelDialog';

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
  openToEmailTab?: boolean;
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
  openToEmailTab = false,
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

  // Auto-switch to email tab when opened programmatically for email
  useEffect(() => {
    if (isOpen && isOpenProp) {
      // Switch to email tab if opened specifically for email
      if (openToEmailTab) {
        setActiveTab('email');
      } else {
        setActiveTab('preview');
      }
    }
  }, [isOpen, isOpenProp, openToEmailTab]);
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');

  const convertPngToPdf = async (imageUrl: string): Promise<string> => {
    const { PDFDocument } = await import('pdf-lib');
    
    // Fetch the PNG image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const imageBytes = await response.arrayBuffer();
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed the PNG image
    const pngImage = await pdfDoc.embedPng(imageBytes);
    
    // 4x6 inches in PDF points (72 points per inch)
    // 4 inches = 288 points, 6 inches = 432 points
    const labelWidth = 288;  // 4 inches or 101.6mm
    const labelHeight = 432; // 6 inches or 152.4mm
    
    // Create a page with 4x6 dimensions
    const page = pdfDoc.addPage([labelWidth, labelHeight]);
    
    // Get the original image dimensions to scale properly
    const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
    const scaleX = labelWidth / imgWidth;
    const scaleY = labelHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    // Center the image on the page
    const x = (labelWidth - scaledWidth) / 2;
    const y = (labelHeight - scaledHeight) / 2;
    
    // Draw the image on the page
    page.drawImage(pngImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
    
    // Save the PDF and create object URL
    const pdfBytes = await pdfDoc.save();
    setOriginalPdfBytes(pdfBytes);
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  };

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
      } else if (labelUrl && labelUrl.toLowerCase().includes('.png')) {
        // Convert PNG to PDF for preview
        convertPngToPdf(labelUrl).then(pdfUrl => {
          setCurrentPreviewUrl(pdfUrl);
          setPreviewType('pdf');
        }).catch(error => {
          console.error('Error converting PNG to PDF:', error);
          setCurrentPreviewUrl(labelUrl);
          setPreviewType('image');
        });
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
      console.log('Loading PDF from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('PDF loaded successfully, size:', arrayBuffer.byteLength, 'bytes');
      
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error('Error loading PDF bytes:', error);
      toast.error('Failed to load PDF for preview. Please try downloading directly.');
      setPreviewType('placeholder');
    }
  };

  const generateLabelPDF = async (fileBytes, layoutOption) => {
    const { PDFDocument, degrees } = await import('pdf-lib');
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const originalPage = await outputPdf.embedPage(originalPdf.getPage(0));
    
    // Get the original dimensions of the label (e.g., 4x6 inches)
    const { width: originalLabelWidth, height: originalLabelHeight } = originalPage.size();
    
    // Page sizes in points (72 points per inch)
    const letterWidth = 612; // 8.5"
    const letterHeight = 792; // 11"
    
    if (layoutOption === '4x6') {
      const page = outputPdf.addPage([originalLabelWidth, originalLabelHeight]);
      page.drawPage(originalPage);
    } else {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Calculate new dimensions after rotation
      const rotatedLabelWidth = originalLabelHeight;
      const rotatedLabelHeight = originalLabelWidth;
      
      // This is the key change: setting the x-coordinate to a fixed position
      // that is much farther to the right. 
      // The value of 550 places the label's bottom-right corner far to the right.
      const xOffset = 550;
      
      const margin = 30;

      if (layoutOption === '8.5x11-2up') {
        const topY = letterHeight - rotatedLabelHeight - margin;
        const bottomY = margin;

        // Draw the top label
        page.drawPage(originalPage, {
          x: xOffset,
          y: topY,
          rotate: degrees(90),
        });

        // Draw the bottom label
        page.drawPage(originalPage, {
          x: xOffset,
          y: bottomY,
          rotate: degrees(90),
        });
      } else if (layoutOption === '8.5x11-top') {
        const topY = letterHeight - rotatedLabelHeight - margin;

        // Draw a single label on the top half
        page.drawPage(originalPage, {
          x: xOffset,
          y: topY,
          rotate: degrees(90),
        });
      } else if (layoutOption === '8.5x11-bottom') {
        const bottomY = margin;

        // Draw a single label on the bottom half
        page.drawPage(originalPage, {
          x: xOffset,
          y: bottomY,
          rotate: degrees(90),
        });
      }
    }
    
    return await outputPdf.save();
};

  const handlePrint = async () => {
    if (previewType === 'pdf' && currentPreviewUrl) {
      try {
        // Open PDF in a new window for printing (more reliable cross-browser)
        const printWindow = window.open(currentPreviewUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 500);
          };
        } else {
          // Fallback: try iframe print
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.focus();
            iframeRef.current.contentWindow.print();
          } else {
            toast.error("Please allow pop-ups or download the PDF to print.");
          }
        }
      } catch (error) {
        console.error("Error printing PDF:", error);
        toast.error("Failed to print. Please download the PDF and print manually.");
      }
    } else if (previewType === 'image' && currentPreviewUrl) {
      // For images, open in new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Print Label</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;">
              <img src="${currentPreviewUrl}" style="max-width:100%;height:auto;" onload="window.print();"/>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      toast.error("No preview available to print. Please download the label.");
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (originalPdfBytes) {
        // Client-side PDF conversion
        const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
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
      toast.loading(`Preparing ${format.toUpperCase()} download...`);
      
      let blob: Blob;
      let filename: string;
      
      // ALWAYS download the original file without modifications
      if (format === 'pdf') {
        const url = labelUrls?.pdf || labelUrl;
        if (!url) {
          toast.error('PDF not available for download.');
          return;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/pdf'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
      } else {
        // Handle PNG and ZPL formats
        const url = labelUrls?.[format] || (format === 'png' ? labelUrl : null);
        if (!url) {
          toast.error(`${format.toUpperCase()} format not available`);
          return;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${format.toUpperCase()}: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { 
          type: format === 'png' ? 'image/png' : 'text/plain'
        });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`;
      }
      
      // Create and trigger download
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      
      toast.dismiss();
      toast.success(`${format.toUpperCase()} label downloaded successfully`);
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.dismiss();
      toast.error(`Failed to download ${format.toUpperCase()} label. Please try again.`);
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
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Prepare batch result data for email
      let emailData;
      if (isBatchPreview && batchResult) {
        emailData = {
          toEmails: validEmails,
          subject: emailSubject,
          description: 'Please find your shipping labels attached.',
          batchResult: batchResult,
          selectedFormats: [emailFormat]
        };
      } else {
        // For single labels, create a mock batch result structure
        emailData = {
          toEmails: validEmails,
          subject: emailSubject,
          description: 'Please find your shipping label attached.',
          batchResult: {
            batchId: shipmentId || 'single-label',
            consolidatedLabelUrls: {
              pdf: labelUrls?.pdf || labelUrl,
              png: labelUrls?.png,
              zpl: labelUrls?.zpl
            },
            scanFormUrl: null
          },
          selectedFormats: [emailFormat]
        };
      }

      toast.loading('Sending email...');
      
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: emailData
      });

      if (error) {
        console.error('Email sending error:', error);
        toast.error('Failed to send email. Please try again.');
        return;
      }

      toast.success(`Email sent successfully to ${validEmails.length} recipient(s)`);
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please check your connection and try again.');
    }
  };

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
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

      <DialogContent className="max-w-4xl bg-white sm:rounded-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center justify-between pr-6 text-base">
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

        <div className="flex-1 flex flex-col pt-2 overflow-y-auto min-h-0">
          {/* Tabs for Preview/Download/Email */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {!isBatchPreview && (
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
            )}

            <TabsContent value="preview" className="flex-1 flex flex-col space-y-3">
              {/* Format Selection - Compact */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">Format:</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-48 h-9 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60]">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer hover:bg-gray-50 py-2">
                        <span className="font-medium text-gray-900">{format.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compact PDF Preview Container */}
              <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 border rounded-lg relative min-h-0">
                {isRegeneratingLabel && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Updating format...</span>
                    </div>
                  </div>
                )}

                {/* Single PDF/Image Preview - More compact */}
                <div className={`bg-white p-2 shadow-lg rounded-lg ${selectedFormat === '4x6' ? 'max-w-xs' : 'max-w-lg'} w-full`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-48 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
                        <p className="text-sm text-purple-800">Regenerating...</p>
                      </div>
                    </div>
                  ) : previewType === 'pdf' && currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={currentPreviewUrl} 
                      style={{ 
                        width: '100%', 
                        height: selectedFormat === '4x6' ? '280px' : '320px', 
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }} 
                      title="Label Preview"
                      onLoad={() => console.log('PDF iframe loaded successfully')}
                      onError={(e) => {
                        console.error('PDF iframe error:', e);
                        toast.error('Failed to load PDF preview');
                      }}
                    />
                  ) : previewType === 'image' && currentPreviewUrl ? (
                    <img 
                      src={currentPreviewUrl} 
                      alt="Shipping Label" 
                      className="max-w-full max-h-64 h-auto border border-gray-300 rounded-lg mx-auto"
                      onLoad={() => console.log('Image loaded successfully')}
                      onError={(e) => {
                        console.error('Image load error:', e);
                        toast.error('Failed to load image preview');
                      }}
                    />
                  ) : (
                    <div className="border border-gray-300 h-48 flex items-center justify-center text-gray-500 rounded-lg">
                      {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf ? (
                        <div className="text-center">
                          <Files className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Batch PDF needed for preview.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Package className="h-12 w-12 mb-3 text-gray-400 mx-auto" />
                          <h3 className="text-sm font-medium mb-1">No Preview Available</h3>
                          <p className="text-xs text-center">
                            {currentPreviewUrl ? 'Loading...' : 'Download the label below.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Always visible at bottom */}
              <div className="flex-shrink-0 grid grid-cols-2 gap-3 pt-3 border-t">
                <Button
                  onClick={handlePrint}
                  disabled={isRegeneratingLabel || !currentPreviewUrl}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
                <Button
                  onClick={() => handleDownload('pdf')}
                  disabled={isRegeneratingLabel || !currentPreviewUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11 font-semibold rounded-lg shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
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

        <DialogFooter className="flex-shrink-0 sm:justify-between pt-3 border-t gap-2">
          <div className="flex gap-2">
            {!isBatchPreview && shipmentId && trackingCode && shipmentDetails && (
              <CancelLabelDialog
                shipmentId={shipmentId}
                trackingCode={trackingCode}
                carrier={shipmentDetails.carrier}
                service={shipmentDetails.service}
                fromAddress={shipmentDetails.fromAddress}
                toAddress={shipmentDetails.toAddress}
              />
            )}
          </div>
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

export default PrintPreview;
