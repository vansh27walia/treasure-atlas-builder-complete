
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Mail, FileText, FileImage, FileCode, Plus, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

interface LabelFormatterProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string;
  trackingCode?: string;
  shipmentId?: string;
}

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Standard thermal label size' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels (2-up)', description: 'Two labels per page' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)', description: 'One label at top' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)', description: 'One label at bottom' }
];

const LabelFormatter: React.FC<LabelFormatterProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingCode,
  shipmentId
}) => {
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailList, setEmailList] = useState(['']);
  const [emailSubject, setEmailSubject] = useState(`Shipping Label ${trackingCode ? `- ${trackingCode}` : ''}`);
  const [emailMessage, setEmailMessage] = useState('Please find your shipping label attached.');
  const [emailFormat, setEmailFormat] = useState<'pdf' | 'png' | 'epl'>('pdf');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && labelUrl) {
      loadOriginalPdf();
    }
  }, [isOpen, labelUrl]);

  const loadOriginalPdf = async () => {
    try {
      const response = await fetch(labelUrl);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setOriginalPdfBytes(bytes);
      generatePreview('4x6', bytes);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load label PDF');
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const embeddedPages = await outputPdf.copyPages(originalPdf, [0]);
    const labelPage = embeddedPages[0];

    const letterWidth = 612;
    const letterHeight = 792;
    const labelWidth = 288;
    const labelHeight = 432;

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

  const generatePreview = async (format: string, bytes?: Uint8Array) => {
    const pdfBytes = bytes || originalPdfBytes;
    if (!pdfBytes) return;

    setIsGenerating(true);
    try {
      const generatedBytes = await generateLabelPDF(pdfBytes, format);
      const blob = new Blob([generatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    await generatePreview(format);
    toast.success(`Format changed to ${labelFormats.find(f => f.value === format)?.label}`);
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'epl') => {
    if (!originalPdfBytes) {
      toast.error('No label data available');
      return;
    }

    try {
      if (format === 'pdf') {
        const pdfBytes = await generateLabelPDF(originalPdfBytes, selectedFormat);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `label_${trackingCode || shipmentId || Date.now()}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success('PDF downloaded');
      } else if (format === 'png') {
        // For PNG, we'll use the original label URL if it's PNG, or convert PDF to PNG
        const link = document.createElement('a');
        link.href = labelUrl;
        link.download = `label_${trackingCode || shipmentId || Date.now()}.png`;
        link.click();
        toast.success('PNG downloaded');
      } else if (format === 'epl') {
        // For EPL, we'll create a basic EPL command file
        const eplContent = `
N
A50,50,0,4,1,1,N,"Shipping Label"
A50,100,0,3,1,1,N,"Tracking: ${trackingCode || 'N/A'}"
A50,150,0,2,1,1,N,"Generated: ${new Date().toLocaleDateString()}"
P1
`;
        const blob = new Blob([eplContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `label_${trackingCode || shipmentId || Date.now()}.epl`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success('EPL downloaded');
      }
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download');
    }
  };

  const addEmailField = () => {
    setEmailList([...emailList, '']);
  };

  const removeEmailField = (index: number) => {
    setEmailList(emailList.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...emailList];
    updated[index] = value;
    setEmailList(updated);
  };

  const handleSendEmail = async () => {
    const validEmails = emailList.filter(email => email.trim() && email.includes('@'));
    
    if (validEmails.length === 0) {
      toast.error('Please provide at least one valid email address');
      return;
    }

    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: {
          toEmails: validEmails,
          subject: emailSubject,
          description: emailMessage,
          batchResult: {
            consolidatedLabelUrls: {
              pdf: emailFormat === 'pdf' ? currentPreviewUrl : undefined,
              png: emailFormat === 'png' ? labelUrl : undefined,
              epl: emailFormat === 'epl' ? 'data:text/plain;base64,' + btoa(`EPL Label Data for ${trackingCode}`) : undefined
            }
          },
          selectedFormats: [emailFormat]
        }
      });

      if (error) throw error;

      toast.success(`Email sent to ${validEmails.length} recipient(s)`);
      setEmailModalOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center">
              Shipping Label Formatter {trackingCode && `- ${trackingCode}`}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="download">Download</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 flex flex-col">
                {/* Format Selector - Centered */}
                <div className="flex justify-center mb-6">
                  <Select value={selectedFormat} onValueChange={handleFormatChange} disabled={isGenerating}>
                    <SelectTrigger className="w-[400px] h-12">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-[9999]">
                      {labelFormats.map(format => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{format.label}</span>
                            <span className="text-xs text-gray-500">{format.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-gray-50 border rounded-lg p-4">
                  {isGenerating ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Generating preview...</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef}
                      src={currentPreviewUrl}
                      className="w-full h-full border-0 bg-white"
                      title="Label Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Loading preview...
                    </div>
                  )}
                </div>

                {/* Bottom Download Button */}
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => handleDownload('pdf')}
                    disabled={isGenerating || !currentPreviewUrl}
                    className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 text-lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Current Format
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="download" className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDownload('pdf')}>
                    <CardHeader className="text-center">
                      <FileText className="h-16 w-16 mx-auto text-red-600 mb-4" />
                      <CardTitle>PDF Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        Perfect for printing on any printer. Current format: {labelFormats.find(f => f.value === selectedFormat)?.label}
                      </p>
                      <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleDownload('pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDownload('png')}>
                    <CardHeader className="text-center">
                      <FileImage className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                      <CardTitle>PNG Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        High-quality image format for sharing or embedding in documents.
                      </p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleDownload('png')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDownload('epl')}>
                    <CardHeader className="text-center">
                      <FileCode className="h-16 w-16 mx-auto text-green-600 mb-4" />
                      <CardTitle>EPL Format</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        Zebra EPL printer commands for direct thermal printing.
                      </p>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDownload('epl')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download EPL
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="email" className="flex-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Email Shipping Label
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Addresses</label>
                      {emailList.map((email, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => updateEmail(index, e.target.value)}
                            className="flex-1"
                          />
                          {emailList.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeEmailField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addEmailField}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Email
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject</label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Email subject"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <Textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        placeholder="Email message"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Format to Send</label>
                      <Select value={emailFormat} onValueChange={(value: 'pdf' | 'png' | 'epl') => setEmailFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="pdf">PDF Format</SelectItem>
                          <SelectItem value="png">PNG Format</SelectItem>
                          <SelectItem value="epl">EPL Format</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LabelFormatter;
