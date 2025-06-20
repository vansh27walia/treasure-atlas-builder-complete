
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, FileText, Download, Printer, Mail, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BatchLabelHeaderProps {
  totalLabels: number;
  successfulLabels: number;
  failedLabels: number;
  batchId?: string;
  onDownloadConsolidated: (format: string) => void;
  onPrintConsolidated: () => void;
  onEmailConsolidated: () => void;
  onCopyConsolidatedLink: () => void;
}

const BatchLabelHeader: React.FC<BatchLabelHeaderProps> = ({
  totalLabels,
  successfulLabels,
  failedLabels,
  batchId,
  onDownloadConsolidated,
  onPrintConsolidated,
  onEmailConsolidated,
  onCopyConsolidatedLink
}) => {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-blue-900">Batch Labels Created</h2>
            <p className="text-blue-700">Batch ID: {batchId || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
              {successfulLabels}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">Successful</p>
          </div>
          
          <div className="text-center">
            <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1">
              {failedLabels}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">Failed</p>
          </div>
          
          <div className="text-center">
            <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
              {totalLabels}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">Total</p>
          </div>
        </div>
      </div>

      {/* Consolidated Actions Toolbar */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Consolidated Actions
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {/* Download Options */}
          <div className="flex gap-1">
            <Button
              onClick={() => onDownloadConsolidated('pdf')}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
            
            <Button
              onClick={() => onDownloadConsolidated('png')}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
            
            <Button
              onClick={() => onDownloadConsolidated('zpl')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              ZPL
            </Button>
            
            <Button
              onClick={() => onDownloadConsolidated('epl')}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              EPL
            </Button>
          </div>

          {/* Additional Actions */}
          <Button
            onClick={onPrintConsolidated}
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Printer className="h-3 w-3 mr-1" />
            Print All
          </Button>
          
          <Button
            onClick={onEmailConsolidated}
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Mail className="h-3 w-3 mr-1" />
            Email All
          </Button>
          
          <Button
            onClick={onCopyConsolidatedLink}
            size="sm"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Link
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BatchLabelHeader;
