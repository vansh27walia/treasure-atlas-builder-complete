
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Mail, Package, CheckCircle } from 'lucide-react';
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
  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Labels Created Successfully!</h1>
          </div>
          <p className="text-xl text-gray-600">Your shipping labels are ready for download, printing, and sharing.</p>
        </div>

        {/* Summary */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-green-800">{successfulLabels.length} Labels Created</h3>
                <p className="text-green-700">Total Cost: ${results.totalCost?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              Ready for Use
            </Badge>
          </div>
        </Card>

        {/* Main 3 Actions */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Choose Your Action</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Download PDF */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Download PDF</h3>
              <p className="text-gray-600 mb-4">Get all labels in one consolidated PDF file</p>
              <Button
                onClick={onDownloadPDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                Download All Labels
              </Button>
            </div>

            {/* 2. Print Preview */}
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Print Preview</h3>
              <p className="text-gray-600 mb-4">Preview labels before printing in multiple formats</p>
              <Button
                onClick={onPrintPreview}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                size="lg"
              >
                Preview & Print
              </Button>
            </div>

            {/* 3. Email Labels */}
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Labels</h3>
              <p className="text-gray-600 mb-4">Send labels directly to an email address</p>
              <Button
                onClick={onEmailLabels}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                size="lg"
              >
                Send via Email
              </Button>
            </div>
          </div>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need to create more labels? <Button variant="link" onClick={() => window.location.reload()}>Upload Another File</Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedSuccessPage;
