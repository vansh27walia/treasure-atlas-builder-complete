
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Download, MailIcon, Archive, FilePdf, FileImage } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: string, fileType: string) => void;
  onEmailLabels: () => void;
  onDownloadZip?: () => void;
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  onEmailLabels,
  onDownloadZip,
  shipmentCount,
}) => {
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [selectedFileType, setSelectedFileType] = useState('pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('format');

  const handleDownload = async () => {
    setIsSubmitting(true);
    try {
      await onFormatSelect(selectedFormat, selectedFileType);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Label Options</DialogTitle>
          <DialogDescription>
            Choose your preferred label format and file type.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
          <InfoIcon className="h-4 w-4 text-blue-700" />
          <AlertDescription className="text-blue-700">
            You are about to download {shipmentCount} {shipmentCount === 1 ? 'label' : 'labels'}.
          </AlertDescription>
        </Alert>
          
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="format">Label Format</TabsTrigger>
            <TabsTrigger value="filetype">File Type</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="space-y-4">
            <div>
              <Label htmlFor="label-size" className="text-base font-medium">Label Size</Label>
              <RadioGroup 
                id="label-size" 
                value={selectedFormat} 
                onValueChange={setSelectedFormat}
                className="grid grid-cols-1 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="4x6" id="r1" />
                  <Label htmlFor="r1" className="flex-grow">4x6" (Thermal Printer)</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="8.5x11-left" id="r2" />
                  <Label htmlFor="r2" className="flex-grow">8.5x11" - 1 Label Left Side</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="8.5x11-right" id="r3" />
                  <Label htmlFor="r3" className="flex-grow">8.5x11" - 1 Label Right Side</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="8.5x11-2up" id="r4" />
                  <Label htmlFor="r4" className="flex-grow">8.5x11" - 2 Labels per Page</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
          
          <TabsContent value="filetype" className="space-y-4">
            <div>
              <Label htmlFor="file-type" className="text-base font-medium">File Format</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div 
                  className={`border rounded-md p-4 text-center cursor-pointer transition-colors ${selectedFileType === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedFileType('pdf')}
                >
                  <FilePdf className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">PDF</p>
                  <p className="text-xs text-gray-500">Best for printing</p>
                </div>
                
                <div 
                  className={`border rounded-md p-4 text-center cursor-pointer transition-colors ${selectedFileType === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedFileType('png')}
                >
                  <FileImage className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">PNG</p>
                  <p className="text-xs text-gray-500">Image format</p>
                </div>
                
                <div 
                  className={`border rounded-md p-4 text-center cursor-pointer transition-colors ${selectedFileType === 'zip' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedFileType('zip')}
                >
                  <Archive className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                  <p className="font-medium">ZIP</p>
                  <p className="text-xs text-gray-500">All formats</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex flex-col gap-2 mt-4">
          {selectedFileType === 'zip' && onDownloadZip ? (
            <Button 
              onClick={onDownloadZip}
              className="w-full bg-amber-600 hover:bg-amber-700" 
              disabled={isSubmitting}
            >
              <Archive className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Downloading...' : 'Download ZIP Package'}
            </Button>
          ) : (
            <Button 
              onClick={handleDownload}
              className="w-full" 
              disabled={isSubmitting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Downloading...' : `Download as ${selectedFileType.toUpperCase()}`}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onEmailLabels}
            className="w-full"
            disabled={isSubmitting}
          >
            <MailIcon className="mr-2 h-4 w-4" />
            Email Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOptionsModal;
