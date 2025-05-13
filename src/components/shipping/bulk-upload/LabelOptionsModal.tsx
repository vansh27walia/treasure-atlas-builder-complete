
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FilePdf, FileImage, FileCode, Archive, Mail } from 'lucide-react';

interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: 'pdf' | 'png' | 'zpl' | 'zip') => void;
  onEmailLabels: () => void;
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  onEmailLabels,
  shipmentCount
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Labels</DialogTitle>
          <DialogDescription>
            Select format and download options for {shipmentCount} shipping labels
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Individual Labels</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Download</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('pdf')}
              >
                <FilePdf className="h-8 w-8 mb-2" />
                <span>PDF</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('png')}
              >
                <FileImage className="h-8 w-8 mb-2" />
                <span>PNG</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('zpl')}
              >
                <FileCode className="h-8 w-8 mb-2" />
                <span>ZPL</span>
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Individual labels will open in new browser tabs
            </p>
          </TabsContent>
          
          <TabsContent value="bulk" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('zip')}
              >
                <Archive className="h-8 w-8 mb-2" />
                <span>ZIP File</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={onEmailLabels}
              >
                <Mail className="h-8 w-8 mb-2" />
                <span>Email</span>
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Bulk download options will package all labels together
            </p>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOptionsModal;
