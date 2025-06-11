
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Printer, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface LabelPrintPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: BulkUploadResult;
  onDownloadBatch: (format: 'png' | 'pdf' | 'zpl') => void;
}

const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({
  open,
  onOpenChange,
  results,
  onDownloadBatch
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const shipmentsWithLabels = results.processedShipments?.filter(shipment => 
    shipment.label_url || shipment.label_urls?.png
  ) || [];

  const currentShipment = shipmentsWithLabels[currentIndex];

  const handlePrint = () => {
    window.print();
  };

  const nextLabel = () => {
    if (currentIndex < shipmentsWithLabels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevLabel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentShipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Label Print Preview</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} of {shipmentsWithLabels.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={prevLabel}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextLabel}
                disabled={currentIndex === shipmentsWithLabels.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Shipment Details */}
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Tracking:</span>
                <p>{currentShipment.tracking_code || 'Pending'}</p>
              </div>
              <div>
                <span className="font-medium">Recipient:</span>
                <p>{currentShipment.customer_name || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium">Carrier:</span>
                <p>{currentShipment.carrier || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium">Service:</span>
                <p>{currentShipment.service || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Label Preview */}
          <div className="flex justify-center">
            {currentShipment.label_urls?.png || currentShipment.label_url ? (
              <img
                src={currentShipment.label_urls?.png || currentShipment.label_url}
                alt={`Shipping label for ${currentShipment.tracking_code}`}
                className="max-w-full border rounded-lg shadow-lg"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No label preview available</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
              <Printer className="h-4 w-4 mr-2" />
              Print Current Label
            </Button>
            
            <Button 
              onClick={() => onDownloadBatch('pdf')} 
              className="bg-red-600 hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All PDF
            </Button>
            
            <Button 
              onClick={() => onDownloadBatch('png')} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All PNG
            </Button>
            
            <Button 
              onClick={() => onDownloadBatch('zpl')} 
              className="bg-gray-600 hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All ZPL
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintPreview;
