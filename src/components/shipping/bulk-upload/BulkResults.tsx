
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface BulkResultsProps {
  results: BulkUploadResult;
}

const BulkResults: React.FC<BulkResultsProps> = ({ results }) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Download className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Labels Created Successfully!
        </h2>
        <p className="text-gray-600">
          {results.successful} out of {results.total} labels were created successfully.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{results.successful}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{results.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
        </div>

        {results.bulk_label_pdf_url && (
          <div className="text-center">
            <Button 
              onClick={() => window.open(results.bulk_label_pdf_url, '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All Labels
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BulkResults;
