
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
import { InfoIcon, Download, MailIcon, Archive } from 'lucide-react';

interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: string, fileType: string) => void;
  onEmailLabels: () => void;
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  onEmailLabels,
  shipmentCount,
}) => {
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [selectedFileType, setSelectedFileType] = useState('pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        <div className="grid gap-6 py-4">
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-700" />
            <AlertDescription className="text-blue-700">
              You are about to download {shipmentCount} {shipmentCount === 1 ? 'label' : 'labels'}.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
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
            
            <div>
              <Label htmlFor="file-type" className="text-base font-medium">File Format</Label>
              <RadioGroup 
                id="file-type" 
                value={selectedFileType} 
                onValueChange={setSelectedFileType}
                className="grid grid-cols-2 gap-2 mt-2"
              >
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="pdf" id="f1" />
                  <Label htmlFor="f1" className="flex-grow">PDF Document</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="png" id="f2" />
                  <Label htmlFor="f2" className="flex-grow">PNG Image</Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 col-span-2">
                  <RadioGroupItem value="zip" id="f3" />
                  <Label htmlFor="f3" className="flex-grow">ZIP Archive (All Formats)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={handleDownload}
              className="w-full" 
              disabled={isSubmitting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Downloading...' : 'Download Labels'}
            </Button>
            
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOptionsModal;
