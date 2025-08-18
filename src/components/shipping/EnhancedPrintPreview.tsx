import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, X, Loader2, Eye, File, FileImage, FileArchive, Mail, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal', description: 'Standard thermal label size (288x432 points)' },
  { value: '8.5x11-2up', label: '8.5x11" - 2-up', description: 'Two labels per page - top and bottom' },
  { value: '8.5x11-top', label: '8.5x11" - Top', description: 'One label at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Bottom', description: 'One label at bottom of letter page' }
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
}

const EnhancedPrintPreview: React.FC<EnhancedPrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentDetails,
  shipmentId
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState('Shipping Label');
  const [emailFormat, setEmailFormat] = useState('pdf');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load original PDF when dialog opens
  useEffect(() => {
    if (isOpen && labelUrl && !originalPdfBytes) {
      loadOriginalPdf();
    }
  }, [isOpen, labelUrl]);

  const loadOriginalPdf = async () => {
    try {
      const response = await fetch(labelUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setOriginalPdfBytes(bytes);
      setCurrentPreviewUrl(labelUrl);
    } catch (error) {
      console.error('Error loading original PDF:', error);
      toast.error('Failed to load label PDF');
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    try {
      const originalPdf = await PDFDocument.load(fileBytes);
      const outputPdf = await PDFDocument.create();

      const pages = await outputPdf.copyPages(originalPdf, [0]);
      
      if (!pages || pages.length === 0) {
        throw new Error('Failed to copy page from original PDF');
      }
      
      const embeddedPage = pages[0];
      
      if (!embeddedPage) {
        throw new Error('Invalid embedded page object');
      }

      const letterWidth = 612;  // 8.5"
      const letterHeight = 792; // 11"
      const labelWidth = 288;   // 4"
      const labelHeight = 432;  // 6"

      if (layoutOption === '4x6') {
        const page = outputPdf.addPage([labelWidth, labelHeight]);
        page.drawPage(embeddedPage, { 
          x: 0, 
          y: 0, 
          width: labelWidth, 
          height: labelHeight 
        });

      } else if (layoutOption === '8.5x11-2up') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { 
          x: (letterWidth - labelWidth) / 2, 
          y: letterHeight - labelHeight - 30,
          width: labelWidth, 
          height: labelHeight 
        });
        page.drawPage(embeddedPage, { 
          x: (letterWidth - labelWidth) / 2, 
          y: 30,
          width: labelWidth, 
          height: labelHeight 
        });

      } else if (layoutOption === '8.5x11-top') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { 
          x: (letterWidth - labelWidth) / 2, 
          y: letterHeight - labelHeight - 30,
          width: labelWidth, 
          height: labelHeight 
        });

      } else if (layoutOption === '8.5x11-bottom') {
        const page = outputPdf.addPage([letterWidth, letterHeight]);
        page.drawPage(embeddedPage, { 
          x: (letterWidth - labelWidth) / 2, 
          y: 30,
          width: labelWidth, 
          height: labelHeight 
        });
      }

      return await outputPdf.save();
    } catch (error) {
      console.error('Error in generateLabelPDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  };

  const handleFormatChange = async (format: string) => {
    if (!originalPdfBytes) {
      toast.error('Original PDF not loaded');
      return;
    }

    setSelectedFormat(format);
    setIsGenerating(true);

    try {
      const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (currentPreviewUrl && currentPreviewUrl !== labelUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
      toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate label format');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (!originalPdfBytes) {
      toast.error('No label data available');
      return;
    }

    try {
      let blob: Blob;
      let filename: string;
      
      if (format === 'pdf') {
        const pdfBytes = await generateLabelPDF(originalPdfBytes, selectedFormat);
        blob = new Blob([pdfBytes], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}_${selectedFormat}.pdf`;
      } else {
        const response = await fetch(labelUrl);
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { 
          type: format === 'png' ? 'image/png' : 'text/plain' 
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

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        toast.success('Print dialog opened');
      } catch (error) {
        console.error("Error printing PDF:", error);
        toast.error("Failed to open print dialog. Please try downloading and printing manually.");
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
    
    toast.info('Email functionality requires backend setup. Please contact support to enable email sending.');
  };

  const dialogTitleText = `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
            <Eye className="h-3 w-3 mr-1" />
            Print Preview
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-4xl bg-white sm:rounded-lg h-[80vh] flex flex-col overflow-hidden">
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
                  <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60] max-h-[160px] overflow-y-auto">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer py-2 hover:bg-gray-50 text-sm">
                        <span className="font-medium">{format.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shipment Details Section */}
              {shipmentDetails && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Shipment Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">From Address:</div>
                      <div className="text-gray-600">{shipmentDetails.fromAddress}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">To Address:</div>
                      <div className="text-gray-600">{shipmentDetails.toAddress}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Dimensions:</div>
                      <div className="text-gray-600">{shipmentDetails.dimensions || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Weight:</div>
                      <div className="text-gray-600">{shipmentDetails.weight}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Carrier:</div>
                      <div className="text-gray-600">{shipmentDetails.carrier}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Service:</div>
                      <div className="text-gray-600">{shipmentDetails.service}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 bg-gray-50 border rounded-lg overflow-hidden">
                <div className="mb-3 text-center">
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label} format...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Preview: {labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}
                    </p>
                  )}
                </div>
                
                <div className="mx-auto bg-white p-3 shadow-lg rounded-lg w-full h-full">
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
                      src={currentPreviewUrl} 
                      style={{ 
                        width: '100%', 
                        height: '400px',
                        minHeight: '400px',
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }} 
                      title="Label Preview"
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

              <div className="pt-4 border-t mt-4 space-y-4">
                <Button
                  onClick={handlePrint}
                  disabled={isGenerating || !currentPreviewUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>

                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleDownload('pdf')}
                    disabled={isGenerating || !currentPreviewUrl}
                    className="bg-red-600 hover:bg-red-700 text-white h-10"
                  >
                    <File className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => handleDownload('png')}
                    disabled={isGenerating}
                    className="bg-green-600 hover:bg-green-700 text-white h-10"
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    PNG
                  </Button>
                  <Button
                    onClick={() => handleDownload('zpl')}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-10"
                  >
                    <FileArchive className="h-4 w-4 mr-2" />
                    ZPL
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div 
                  className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg border-blue-500 bg-blue-50 hover:bg-blue-100"
                  onClick={() => handleDownload('pdf')}
                >
                  <File className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                  <h4 className="font-bold text-lg mb-2">PDF Format</h4>
                  <p className="text-sm text-gray-600 mb-4">Best for printing and archiving</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
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

            <TabsContent value="email" className="flex-1">
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
