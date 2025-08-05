
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, CheckCircle, XCircle, DollarSign, Truck } from 'lucide-react';
import { BulkProcessingResult } from '@/hooks/useBulkShippingProcessor';

interface BulkResultsProps {
  results: BulkProcessingResult;
  onRateChange: (shipmentId: string, rateId: string) => void;
}

const BulkResults: React.FC<BulkResultsProps> = ({ results, onRateChange }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rates_fetched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rates_fetched':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-2xl font-bold">{results.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{results.successful}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">${results.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments List */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.processedShipments.map((shipment, index) => (
              <div key={shipment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(shipment.status)}
                    <div>
                      <h4 className="font-medium">
                        {shipment.shipment_data?.to_name || `Shipment ${index + 1}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {shipment.shipment_data?.to_city}, {shipment.shipment_data?.to_state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(shipment.status)}
                    <span className="font-medium">${shipment.total_cost.toFixed(2)}</span>
                  </div>
                </div>

                {shipment.status === 'error' && (
                  <div className="bg-red-50 p-3 rounded-md">
                    <p className="text-sm text-red-600">
                      Error: {shipment.error_message}
                    </p>
                  </div>
                )}

                {shipment.status === 'rates_fetched' && shipment.rates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Available Rates:</span>
                    </div>
                    
                    <Select
                      value={shipment.selected_rate_id || ''}
                      onValueChange={(value) => onRateChange(shipment.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a shipping rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.rates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{rate.carrier}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  {rate.service}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">${rate.total_cost?.toFixed(2) || rate.rate}</span>
                                <div className="text-xs text-gray-500">
                                  {rate.delivery_days} days
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {shipment.insurance_amount && shipment.insurance_amount > 0 && (
                      <div className="text-sm text-gray-600">
                        Insurance: ${shipment.insurance_cost?.toFixed(2)} 
                        (${shipment.insurance_amount} declared value)
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkResults;
