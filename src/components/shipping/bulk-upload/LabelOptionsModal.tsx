
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Image, FileCode, Archive, Mail, Download } from 'lucide-react';

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
          <DialogTitle className="text-xl">Download Labels</DialogTitle>
          <DialogDescription>
            Select format and download options for {shipmentCount} shipping labels
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="text-sm">Individual Labels</TabsTrigger>
            <TabsTrigger value="bulk" className="text-sm">Bulk Download</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-6 border-2 hover:border-blue-500 hover:bg-blue-50"
                onClick={() => onFormatSelect('pdf')}
              >
                <FileText className="h-10 w-10 mb-2 text-blue-600" />
                <span className="font-medium">PDF</span>
                <span className="text-xs text-gray-500 mt-1">Standard</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-6 border-2 hover:border-green-500 hover:bg-green-50"
                onClick={() => onFormatSelect('png')}
              >
                <Image className="h-10 w-10 mb-2 text-green-600" />
                <span className="font-medium">PNG</span>
                <span className="text-xs text-gray-500 mt-1">Image</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-6 border-2 hover:border-purple-500 hover:bg-purple-50"
                onClick={() => onFormatSelect('zpl')}
              >
                <FileCode className="h-10 w-10 mb-2 text-purple-600" />
                <span className="font-medium">ZPL</span>
                <span className="text-xs text-gray-500 mt-1">Printer</span>
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Preview Option:</span> Labels will open in a new window for preview before printing
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-6 border-2 hover:border-amber-500 hover:bg-amber-50"
                onClick={() => onFormatSelect('zip')}
              >
                <Archive className="h-10 w-10 mb-2 text-amber-600" />
                <span className="font-medium">ZIP File</span>
                <span className="text-xs text-gray-500 mt-1">All Labels</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-6 border-2 hover:border-cyan-500 hover:bg-cyan-50"
                onClick={onEmailLabels}
              >
                <Mail className="h-10 w-10 mb-2 text-cyan-600" />
                <span className="font-medium">Email</span>
                <span className="text-xs text-gray-500 mt-1">Send All</span>
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center">
                <Download className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium">Save to Local Storage</span>
              </div>
              <Button size="sm" onClick={() => onFormatSelect('pdf')}>
                Download All
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
