
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LabelSummaryProps {
  trackingCode: string | null;
  selectedFormat: 'pdf' | 'png' | 'zpl';
  handleRefreshLabel: () => void;
  isRefreshing: boolean;
  shipmentId?: string | null;
}

const LabelSummary: React.FC<LabelSummaryProps> = ({ 
  trackingCode, 
  selectedFormat, 
  handleRefreshLabel, 
  isRefreshing,
  shipmentId 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h3 className="font-semibold text-green-800 text-xl mb-2">Label Generated Successfully!</h3>
        <p className="text-sm text-green-700 mb-1">
          Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-green-200">{trackingCode}</span>
        </p>
        <p className="text-sm text-green-700">Format: <span className="font-medium">{selectedFormat.toUpperCase()}</span></p>
      </div>
      {shipmentId && (
        <Button
          onClick={handleRefreshLabel}
          variant="outline"
          size="sm"
          className="mt-3 sm:mt-0 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
          Refresh Label
        </Button>
      )}
    </div>
  );
};

export default LabelSummary;
