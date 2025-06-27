
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BulkShipmentsList from './BulkShipmentsList';
import { BulkShipment } from '@/types/shipping';

interface RateSelectionPageProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  batchError: { packageNumber: number; error: string; shipmentId: string } | null;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: () => void;
  onCreateLabels: () => void;
  onClearBatchError: () => void;
  isCreatingLabels: boolean;
}

const RateSelectionPage: React.FC<RateSelectionPageProps> = ({
  shipments,
  isFetchingRates,
  batchError,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onCreateLabels,
  onClearBatchError,
  isCreatingLabels
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Batch Error Alert */}
      {batchError && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <Alert className="border-red-200 bg-red-50 max-w-6xl mx-auto">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>Batch Processing Error:</strong> Package #{batchError.packageNumber} encountered an issue. 
                Please review and adjust the settings to continue.
                <div className="mt-1 text-sm text-red-700">
                  {batchError.error}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearBatchError}
                className="text-red-600 hover:text-red-800"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rate Selection & Configuration</h1>
          <p className="text-xl text-gray-600">Review and select shipping rates for your shipments</p>
        </div>
        
        {isFetchingRates && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-blue-800 font-semibold text-lg">Fetching latest shipping rates...</span>
            </div>
          </div>
        )}
        
        <Card className="shadow-xl border-0 bg-white">
          <BulkShipmentsList
            shipments={shipments}
            isFetchingRates={isFetchingRates}
            onSelectRate={onSelectRate}
            onRemoveShipment={onRemoveShipment}
            onEditShipment={onEditShipment}
            onRefreshRates={onRefreshRates}
          />
        </Card>
        
        {/* Create Labels Button */}
        <div className="mt-10 flex justify-center">
          <Button
            onClick={onCreateLabels}
            disabled={isCreatingLabels || !shipments.some(s => s.selectedRateId)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-16 py-6 text-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
            size="lg"
          >
            {isCreatingLabels ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                Creating Labels...
              </>
            ) : (
              <>
                <Package className="mr-4 h-8 w-8" />
                Create All Labels ({shipments.filter(s => s.selectedRateId).length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RateSelectionPage;
