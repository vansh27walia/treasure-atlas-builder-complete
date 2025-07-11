
import React from 'react';
import { Modal } from 'react-bootstrap';
import { Button } from '@/components/ui/button';
import { Download, Printer, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PrintPreviewProps {
  show: boolean;
  onHide: () => void;
  labelUrl: string;
  shipmentData?: any;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  show,
  onHide,
  labelUrl,
  shipmentData
}) => {
  const handlePrint = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleDownload = () => {
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Print Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={onHide}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center space-x-2">
            <Button onClick={handlePrint} className="flex items-center">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
          
          {labelUrl && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={labelUrl}
                width="100%"
                height="600px"
                title="Label Preview"
                className="border-0"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrintPreview;
