
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download, Printer, Share, ZoomIn, ZoomOut, Check, X, ChevronsUpDown } from 'lucide-react';
import { toast } from "sonner";

interface LabelPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelUrl: string | null;
  onPrint: () => void;
  onDownload: () => void;
}

const LabelPreviewModal: React.FC<LabelPreviewModalProps> = ({
  open,
  onOpenChange,
  labelUrl,
  onPrint,
  onDownload
}) => {
  const [paperSize, setPaperSize] = React.useState<'4x6' | 'letter' | 'a4'>('4x6');
  const [zoom, setZoom] = React.useState(100);
  
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in' && zoom < 200) {
      setZoom(zoom + 25);
    } else if (direction === 'out' && zoom > 50) {
      setZoom(zoom - 25);
    }
  };

  const handleDownload = () => {
    try {
      onDownload();
      toast.success("Label downloaded successfully");
    } catch (error) {
      toast.error("Failed to download label");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Label Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <TabsList className="self-center">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Print Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="flex-1 flex flex-col mt-4">
            <div className="bg-gray-100 rounded-md border flex-1 overflow-auto p-6 flex items-center justify-center">
              {labelUrl ? (
                <div style={{transform: `scale(${zoom/100})`}} className="transition-transform bg-white shadow-md">
                  <AspectRatio ratio={paperSize === '4x6' ? 3/2 : 8.5/11} className="min-w-[400px] max-w-[600px]">
                    {labelUrl.endsWith('.pdf') ? (
                      <iframe 
                        src={`${labelUrl}#view=FitH`} 
                        className="w-full h-full border rounded"
                        title="Label preview"
                      />
                    ) : (
                      <img 
                        src={labelUrl} 
                        alt="Shipping Label" 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </AspectRatio>
                </div>
              ) : (
                <div className="text-center p-12">
                  <p>No label preview available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium mb-3">Paper Size</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={paperSize === '4x6' ? "default" : "outline"} 
                    onClick={() => setPaperSize('4x6')}
                    className="flex items-center"
                  >
                    {paperSize === '4x6' && <Check className="mr-1 h-4 w-4" />}
                    4 × 6
                  </Button>
                  <Button 
                    variant={paperSize === 'letter' ? "default" : "outline"}
                    onClick={() => setPaperSize('letter')}
                    className="flex items-center"
                  >
                    {paperSize === 'letter' && <Check className="mr-1 h-4 w-4" />}
                    Letter
                  </Button>
                  <Button 
                    variant={paperSize === 'a4' ? "default" : "outline"}
                    onClick={() => setPaperSize('a4')}
                    className="flex items-center"
                  >
                    {paperSize === 'a4' && <Check className="mr-1 h-4 w-4" />}
                    A4
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium mb-3">Label Position</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-24 relative border-2 border-dashed flex flex-col">
                    <div className="absolute top-2 left-2 right-2 h-8 bg-gray-200 rounded"></div>
                    <span className="mt-auto text-xs text-gray-500">Top</span>
                  </Button>
                  <Button variant="outline" className="h-24 relative border-2 border-dashed flex flex-col">
                    <div className="absolute bottom-2 left-2 right-2 h-8 bg-gray-200 rounded"></div>
                    <span className="mt-auto text-xs text-gray-500">Bottom</span>
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Multiple Labels</h3>
                  <Button size="sm" variant="ghost">
                    <ChevronsUpDown className="h-4 w-4 mr-1" />
                    Sort
                  </Button>
                </div>
                <div className="p-3 bg-white border rounded-md">
                  <p className="text-sm text-gray-600">Print multiple labels (2 per page)</p>
                  <div className="mt-2 flex items-center">
                    <Button size="sm" variant="outline" className="text-xs mr-2">2 per page</Button>
                    <Button size="sm" variant="outline" className="text-xs">4 per page</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-row gap-2 justify-between sm:justify-between border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" onClick={onPrint}>
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button onClick={onPrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPreviewModal;
