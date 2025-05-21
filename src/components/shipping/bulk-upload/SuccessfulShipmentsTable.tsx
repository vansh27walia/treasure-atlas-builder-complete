
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onDownloadAllLabels?: () => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel,
  onDownloadAllLabels
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zip'>('pdf');
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<BulkShipment | null>(null);
  
  if (shipments.length === 0) return null;
  
  const handleDownload = (labelUrl: string, format: string = 'pdf') => {
    onDownloadSingleLabel(labelUrl, format);
    toast.success(`Downloading ${format.toUpperCase()} label`);
  };
  
  const handleBulkDownload = (format: 'pdf' | 'png' | 'zip' = 'pdf') => {
    setSelectedFormat(format);
    if (onDownloadAllLabels) {
      onDownloadAllLabels();
      toast.success(`Preparing ${format.toUpperCase()} labels for download`);
    } else {
      // Fallback: Download each label individually
      shipments.forEach(shipment => {
        if (shipment.label_url) {
          setTimeout(() => handleDownload(shipment.label_url || '', format), 300);
        }
      });
    }
  };

  const handleViewLabel = (shipment: BulkShipment) => {
    setCurrentShipment(shipment);
    setIsLabelDialogOpen(true);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">Successfully Processed Shipments</h5>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
              <Download className="h-4 w-4" /> 
              Download All Labels
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkDownload('pdf')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-600" /> PDF Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-green-600" /> PNG Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('zip')} className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-amber-600" /> ZIP Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell>{shipment.row}</TableCell>
                <TableCell>{shipment.recipient}</TableCell>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>{shipment.tracking_code || shipment.trackingCode}</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Label Generated
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 px-2 py-1"
                      onClick={() => handleViewLabel(shipment)}
                    >
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'pdf')}>
                          <File className="h-4 w-4 text-blue-600 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'png')}>
                          <File className="h-4 w-4 text-green-600 mr-2" /> Download PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'zip')}>
                          <FileArchive className="h-4 w-4 text-amber-600 mr-2" /> Download ZIP
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Label Preview Dialog */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="min-h-[400px] flex items-center justify-center border rounded-md p-4">
              {currentShipment?.label_url ? (
                <iframe 
                  src={currentShipment.label_url} 
                  className="w-full h-[500px]" 
                  title="Label Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <File className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Label preview not available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="download">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                    onClick={() => setSelectedFormat('pdf')}
                  >
                    <File className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">PDF Format</h4>
                    <p className="text-xs text-gray-500">Best for printing</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}
                    `}
                    onClick={() => setSelectedFormat('png')}
                  >
                    <File className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">PNG Format</h4>
                    <p className="text-xs text-gray-500">Image format</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'zip' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                    `}
                    onClick={() => setSelectedFormat('zip')}
                  >
                    <FileArchive className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-medium">ZPL Format</h4>
                    <p className="text-xs text-gray-500">For thermal printers</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => currentShipment && handleDownload(currentShipment.label_url || '', selectedFormat)} 
                  className={`w-full h-12 ${
                    selectedFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 
                    selectedFormat === 'png' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download {selectedFormat.toUpperCase()} File
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessfulShipmentsTable;
