import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Image, FileCode, DownloadCloud } from 'lucide-react'; // Mail icon removed, DownloadCloud potentially used

// Props definition for the modal
interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Updated format options to be more specific to backend capabilities
  onFormatSelect: (
    format:
      | 'individual_pdf' // User clicks PDF, parent will open individual PNGs
      | 'individual_png'
      // 'individual_zpl' // ZPL is not supported by the backend for individuals, so it's disabled
      | 'consolidated_pdf' // For the bulk "PDF" (which is PNG data from backend)
      | 'consolidated_png' // For the bulk PNG from backend
  ) => void;
  // onEmailLabels is removed as this functionality isn't supported by the first backend
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  shipmentCount
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Labels</DialogTitle>
          <DialogDescription>
            Select format and download options for {shipmentCount} shipping label{shipmentCount === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Individual Labels</TabsTrigger>
            <TabsTrigger value="bulk">Consolidated Label</TabsTrigger> {/* Tab title clarified */}
          </TabsList>
          
          <TabsContent value="single" className="pt-4">
            <p className="text-sm text-muted-foreground mb-3"> {/* Using text-muted-foreground for potentially better theme compatibility */}
              Download each label separately. PDFs will open as images.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"> {/* Adjusted grid */}
              <Button  
                variant="outline"  
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('individual_pdf')}
              >
                <FileText className="h-8 w-8 mb-2" />
                <span>PDF (as Image)</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('individual_png')}
              >
                <Image className="h-8 w-8 mb-2" />
                <span>PNG</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => { /* ZPL is not supported, no action */ }}
                disabled // Disable ZPL as it's not provided by backend
              >
                <FileCode className="h-8 w-8 mb-2" />
                <span>ZPL (Unavailable)</span>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Individual labels will open in new browser tabs.
            </p>
          </TabsContent>
          
          <TabsContent value="bulk" className="pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Download all labels combined into a single file.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('consolidated_pdf')}
              >
                <DownloadCloud className="h-8 w-8 mb-2" /> {/* Icon representing download */}
                <span>Consolidated PDF</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => onFormatSelect('consolidated_png')}
              >
                <Image className="h-8 w-8 mb-2" />
                <span>Consolidated PNG</span>
              </Button>

              {/* The "Email" button was here. It's removed because the first backend doesn't support emailing.
                If you add email functionality to a backend later, you could re-add a similar button
                and the corresponding onEmailLabels prop.
              */}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              The consolidated file contains all labels merged together. The "PDF" is image data presented as a PDF.
            </p>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOptionsModal;
