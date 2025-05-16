
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Image, FileCode, Archive, Mail, Printer } from 'lucide-react';

interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: 'pdf' | 'png' | 'zpl' | 'zip') => void;
  onPrint: () => void;
  onEmailLabels: () => void;
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  onPrint,
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
        
        <Tabs defaultValue="download" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="print">Print</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
          
          <TabsContent value="download" className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('pdf')}
              >
                <FileText className="h-8 w-8 mb-2" />
                <span>PDF</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('png')}
              >
                <Image className="h-8 w-8 mb-2" />
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
              Download labels in your preferred format
            </p>
          </TabsContent>
          
          <TabsContent value="print" className="pt-4">
            <div className="text-center p-6">
              <Printer className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Print Labels</h3>
              <p className="text-sm text-gray-600 mb-4">
                Print {shipmentCount} shipping labels directly to your printer
              </p>
              <Button onClick={onPrint} className="w-full">
                <Printer className="mr-2 h-4 w-4" /> Print Now
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="pt-4">
            <div className="text-center p-6">
              <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Email Labels</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send {shipmentCount} shipping labels to your email
              </p>
              <Button onClick={onEmailLabels} className="w-full">
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </Button>
            </div>
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
