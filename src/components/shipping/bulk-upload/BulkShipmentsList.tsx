
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Package, Truck, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface BulkShipmentsListProps {
  results: BulkUploadResult;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: any) => void;
  onCreateLabels: () => void;
  isCreatingLabels: boolean;
  searchTerm: string;
  sortField: 'recipient' | 'carrier' | 'rate';
  sortDirection: 'asc' | 'desc';
  selectedCarrierFilter: string;
  filteredShipments: any[];
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  results,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onCreateLabels,
  isCreatingLabels,
  filteredShipments
}) => {

  // Check if all shipments have rates and selected rates
  const shipmentsWithRates = filteredShipments.filter(s => s.availableRates && s.availableRates.length > 0);
  const shipmentsWithSelectedRates = filteredShipments.filter(s => s.selectedRateId);
  
  // Calculate total cost
  const totalCost = filteredShipments.reduce((sum, shipment) => {
    const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
    return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Summary
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredShipments.length} shipments
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {shipmentsWithRates.length}
              </div>
              <div className="text-sm text-gray-600">Rates Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {shipmentsWithSelectedRates.length}
              </div>
              <div className="text-sm text-gray-600">Rates Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment, index) => (
          <Card key={shipment.id} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {shipment.recipient || shipment.details?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}
                  </p>
                </div>
                <Badge 
                  variant={shipment.status === 'completed' ? 'default' : 'secondary'}
                  className={shipment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {shipment.status}
                </Badge>
              </div>

              {/* Rate Selection */}
              {shipment.availableRates && shipment.availableRates.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Shipping Rate:
                  </label>
                  <div className="grid gap-2">
                    {shipment.availableRates.slice(0, 3).map((rate) => (
                      <div
                        key={rate.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          shipment.selectedRateId === rate.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onSelectRate(shipment.id, rate.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              shipment.selectedRateId === rate.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {shipment.selectedRateId === rate.id && (
                                <CheckCircle className="w-3 h-3 text-white m-0.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {rate.carrier.toUpperCase()} {rate.service}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {rate.delivery_days} business days
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              ${parseFloat(rate.rate).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm">Loading rates...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BulkShipmentsList;
