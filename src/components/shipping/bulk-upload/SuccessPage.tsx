
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, Mail, Package } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface SuccessPageProps {
  results: BulkUploadResult;
  onDownloadPDF: () => void;
  onPrintPreview: () => void;
  onEmailLabels: () => void;
  onDownloadConsolidated: (format: string) => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({
  results,
  onDownloadPDF,
  onPrintPreview,
  onEmailLabels,
  onDownloadConsolidated
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Labels Created Successfully!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your shipping labels are ready. Choose your preferred action below.
          </p>
        </div>

        {/* Success Summary */}
        <Card className="p-6 bg-white/80 backdrop-blur-lg shadow-lg border-0 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {results.processedShipments?.length || 0}
              </div>
              <div className="text-gray-600 text-sm font-medium">Labels Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                ${results.totalCost?.toFixed(2) || '0.00'}
              </div>
              <div className="text-gray-600 text-sm font-medium">Total Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {results.batchResult ? 'Ready' : 'Processing'}
              </div>
              <div className="text-gray-600 text-sm font-medium">Batch Status</div>
            </div>
          </div>
        </Card>

        {/* Main Action Buttons */}
        <div className="flex justify-center gap-6 mb-8">
          <Button
            onClick={onDownloadPDF}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-200"
            size="lg"
          >
            <Download className="mr-3 h-6 w-6" />
            Download PDF Labels
          </Button>

          <Button
            onClick={onPrintPreview}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 text-lg font-bold shadow-xl transform hover:scale-105 transition-all duration-200"
            size="lg"
          >
            <FileText className="mr-3 h-6 w-6" />
            Print Preview & Options
          </Button>
        </div>

        {/* Consolidated Label Options */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Consolidated Label Downloads
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => onDownloadConsolidated('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => onDownloadConsolidated('png')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button
              onClick={() => onDownloadConsolidated('zpl')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              ZPL
            </Button>
            <Button
              onClick={() => onDownloadConsolidated('epl')}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              EPL
            </Button>
          </div>
        </Card>

        {/* Additional Actions */}
        <div className="text-center">
          <Button
            onClick={onEmailLabels}
            variant="outline"
            className="bg-white/90 backdrop-blur-lg border-gray-200 hover:bg-white shadow-lg px-6 py-3"
            size="lg"
          >
            <Mail className="h-5 w-5 mr-2" />
            Email Labels
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
