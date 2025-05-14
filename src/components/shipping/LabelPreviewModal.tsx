
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, X } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface LabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string | null;
  trackingCode?: string;
  onDownload: (format: string) => void;
}

const LabelPreviewModal: React.FC<LabelPreviewModalProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingCode,
  onDownload
}) => {
  const [labelFormat, setLabelFormat] = React.useState<string>('pdf');
  
  const handlePrint = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };
  
  const handleDownload = () => {
    onDownload(labelFormat);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Shipping Label Preview
            {trackingCode && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({trackingCode})
              </span>
            )}
          </DialogTitle>
          <Button 
            className="absolute right-4 top-4" 
            variant="ghost" 
            onClick={onClose}
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-2">
          {labelUrl ? (
            <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm bg-white w-full">
              <iframe 
                src={labelUrl} 
                className="w-full h-[400px]" 
                title="Shipping Label Preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] w-full border border-dashed border-gray-300 rounded-md">
              <p className="text-gray-500">Label preview not available</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-4">
          <div className="flex-1">
            <Select value={labelFormat} onValueChange={setLabelFormat}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Label Format</SelectLabel>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="zpl">ZPL (Thermal Printer)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={handlePrint} 
            disabled={!labelUrl}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={!labelUrl}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPreviewModal;
