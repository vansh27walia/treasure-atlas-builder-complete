
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Package, DollarSign, Clock, RefreshCw, Brain, Zap } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import BulkShipmentsList from './BulkShipmentsList';
import { useState } from 'react';
import AIRateAnalysisPanel from '../AIRateAnalysisPanel';
import { standardizeCarrierName } from '@/utils/carrierUtils';

interface BulkResultsProps {
  results: BulkUploadResult;
  onRefreshRates: () => void;
  isRefreshing: boolean;
  onCreateLabels: () => void;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRefreshSingleRate: (shipmentId: string) => void;
  onBulkApplyCarrier: (carrierName: string) => void;
}

const BulkResults: React.FC<BulkResultsProps> = ({
  results,
  onRefreshRates,
  isRefreshing,
  onCreateLabels,
  onSelectRate,
  onRefreshSingleRate,
  onBulkApplyCarrier
}) => {
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  const completedShipments = results.processedShipments?.filter(s => s.status === 'completed') || [];
  const failedShipments = results.processedShipments?.filter(s => s.status === 'error') || [];
  const loadingShipments = results.processedShipments?.filter(s => s.status === 'pending_rates') || [];

  const totalCost = results.totalCost || 0;

  // Handle rate selection and show AI panel
  const handleRateSelection = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
    
    // Find the shipment and selected rate
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    const rate = shipment?.availableRates?.find(r => r.id.toString() === rateId);
    
    if (shipment && rate) {
      // Standardize the carrier name for display
      const standardizedRate = {
        ...rate,
        carrier: standardizeCarrierName(rate.carrier)
      };
      
      setSelectedShipment(shipment);
      setSelectedRate(standardizedRate);
      setShowAIPanel(true);
    }
  };

  const handleOptimizationChange = (filter: string) => {
    // Apply optimization to all shipments
    const carrierMapping = {
      'cheapest': 'USPS',
      'fastest': 'UPS', 
      'most-reliable': 'UPS',
      'balanced': 'FedEx'
    };
    
    const targetCarrier = carrierMapping[filter];
    if (targetCarrier) {
      onBulkApplyCarrier(targetCarrier);
    }
    
    setShowAIPanel(false);
  };

  // Get all available rates with standardized carrier names for AI panel
  const getAllStandardizedRates = () => {
    const allRates = [];
    results.processedShipments.forEach(shipment => {
      if (shipment.availableRates) {
        shipment.availableRates.forEach(rate => {
          allRates.push({
            ...rate,
            carrier: standardizeCarrierName(rate.carrier),
            shipmentId: shipment.id
          });
        });
      }
    });
    return allRates;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-xl font-bold">{results.processedShipments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-xl font-bold text-green-600">{completedShipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Loading</p>
                <p className="text-xl font-bold text-yellow-600">{loadingShipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-xl font-bold text-purple-600">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={onRefreshRates} 
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All Rates
        </Button>

        <Button 
          onClick={() => setShowAIPanel(!showAIPanel)}
          variant="outline"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:bg-blue-100"
        >
          <Brain className="w-4 h-4 text-blue-600" />
          <Zap className="w-3 h-3 text-purple-600" />
          AI Powered Analysis
        </Button>

        {completedShipments.length > 0 && (
          <Button 
            onClick={onCreateLabels}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Create Labels ({completedShipments.length})
          </Button>
        )}
      </div>

      {/* Failed Shipments Alert */}
      {failedShipments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              Failed Shipments ({failedShipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-3">
              Some shipments failed to process. Please review and try again.
            </p>
            <div className="space-y-2">
              {failedShipments.slice(0, 3).map((shipment, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">#{shipment.id}</span>: {shipment.error || 'Unknown error'}
                </div>
              ))}
              {failedShipments.length > 3 && (
                <p className="text-sm text-red-600">...and {failedShipments.length - 3} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipments List */}
      <BulkShipmentsList 
        shipments={results.processedShipments || []}
        onSelectRate={handleRateSelection}
        onRefreshRates={onRefreshSingleRate}
        onBulkApplyCarrier={onBulkApplyCarrier}
      />

      {/* AI Analysis Panel */}
      {showAIPanel && selectedRate && (
        <AIRateAnalysisPanel
          selectedRate={selectedRate}
          allRates={getAllStandardizedRates()}
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          onOptimizationChange={handleOptimizationChange}
        />
      )}
    </div>
  );
};

export default BulkResults;
