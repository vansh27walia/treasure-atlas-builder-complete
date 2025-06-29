
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail, CheckCircle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface StreamlinedSuccessPageProps {
  results: BulkUploadResult;
  onDownloadPDF: () => void;
  onPrintPreview: () => void;
  onEmailLabels: () => void;
}

const StreamlinedSuccessPage: React.FC<StreamlinedSuccessPageProps> = ({
  results,
  onDownloadPDF,
  onPrintPreview,
  onEmailLabels
}) => {
  const successfulLabels = results.processedShipments?.filter(s => s.label_url)?.length || 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl w-full">
        <Card className="p-10 shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Labels Created Successfully!
            </h1>
            <p className="text-lg text-gray-600">
              {successfulLabels} shipping labels have been generated and are ready for use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={onDownloadPDF}
              className="h-16 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-6 w-6" />
              <span>Download PDF</span>
            </Button>

            <Button
              onClick={onPrintPreview}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 border-2"
            >
              <Printer className="h-6 w-6" />
              <span>Print Preview</span>
            </Button>

            <Button
              onClick={onEmailLabels}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2 border-2"
            >
              <Mail className="h-6 w-6" />
              <span>Email Labels</span>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total shipments processed: {results.processedShipments?.length || 0}</p>
              <p>Successful labels: {successfulLabels}</p>
              <p>Total cost: ${results.totalCost?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StreamlinedSuccessPage;
