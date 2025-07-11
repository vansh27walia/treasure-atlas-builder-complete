
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Truck, Package, DollarSign, Clock, Trash2, Edit, RefreshCw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId?: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [bulkCarrier, setBulkCarrier] = useState('');
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());

  // Filter shipments based on search and carrier filter
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.details?.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = carrierFilter === 'all' || 
      shipment.availableRates?.some(rate => rate.carrier.toLowerCase() === carrierFilter.toLowerCase());
    
    return matchesSearch && matchesCarrier;
  });

  // Get unique carriers for filter
  const availableCarriers = Array.from(new Set(
    shipments.flatMap(s => s.availableRates?.map(r => r.carrier) || [])
  ));

  // FIXED: Apply bulk carrier to ALL filtered shipments
  const handleBulkApplyCarrier = () => {
    if (!bulkCarrier) return;
    
    console.log(`Applying bulk carrier "${bulkCarrier}" to ${filteredShipments.length} shipments`);
    
    filteredShipments.forEach(shipment => {
      // Find the best rate for this carrier
      const carrierRates = shipment.availableRates?.filter(
        rate => rate.carrier.toLowerCase() === bulkCarrier.toLowerCase()
      ) || [];
      
      if (carrierRates.length > 0) {
        // Sort by rate and pick the cheapest
        const bestRate = carrierRates.sort((a, b) => 
          parseFloat(a.rate.toString()) - parseFloat(b.rate.toString())
        )[0];
        
        console.log(`Applying rate ${bestRate.id} to shipment ${shipment.id}`);
        onSelectRate(shipment.id, bestRate.id);
      } else {
        console.warn(`No rates found for carrier ${bulkCarrier} on shipment ${shipment.id}`);
      }
    });
    
    setBulkCarrier('');
  };

  const toggleExpanded = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId);
    } else {
      newExpanded.add(shipmentId);
    }
    setExpandedShipments(newExpanded);
  };

  const getSelectedRate = (shipment: BulkShipment) => {
    if (!shipment.selectedRateId || !shipment.availableRates) return null;
    return shipment.availableRates.find(rate => rate.id === shipment.selectedRateId);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Bulk Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Shipments</h2>
          <p className="text-gray-600">
            {filteredShipments.length} of {shipments.length} shipments shown
          </p>
        </div>
        
        {/* Bulk Carrier Application - ENHANCED */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Apply to ALL visible shipments:</label>
            <div className="flex gap-2">
              <Select value={bulkCarrier} onValueChange={setBulkCarrier}>
                <SelectTrigger className="w-48 bg-white shadow-sm">
                  <SelectValue placeholder="Choose carrier..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCarriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier.toLowerCase()}>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4" />
                        <span>{carrier}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkApplyCarrier}
                disabled={!bulkCarrier || isFetchingRates}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Apply to {filteredShipments.length}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Search by recipient name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="sm:w-48">
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {availableCarriers.map(carrier => (
                <SelectItem key={carrier} value={carrier.toLowerCase()}>
                  {carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => onRefreshRates()}
          disabled={isFetchingRates}
          variant="outline"
          className="sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingRates ? 'animate-spin' : ''}`} />
          Refresh Rates
        </Button>
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment, index) => {
          const selectedRate = getSelectedRate(shipment);
          const isExpanded = expandedShipments.has(shipment.id);
          
          return (
            <Card key={shipment.id} className={`transition-all duration-300 ${
              selectedRate ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {shipment.recipient || `Shipment ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {shipment.details?.to_city}, {shipment.details?.to_state} {shipment.details?.to_zip}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {selectedRate && (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Rate Selected
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(shipment.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Selected Rate Display */}
                {selectedRate && (
                  <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <RateDisplay
                        actualRate={selectedRate.rate}
                        carrier={selectedRate.carrier}
                        service={selectedRate.service}
                        deliveryDays={selectedRate.delivery_days}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(shipment.id)}
                        className="border-green-400 text-green-700 hover:bg-green-200"
                      >
                        Change Rate
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expanded Rate Selection */}
                {(isExpanded || !selectedRate) && (
                  <div className="space-y-4">
                    {isFetchingRates ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Fetching latest rates...</p>
                      </div>
                    ) : shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <div className="grid gap-3">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <Truck className="h-4 w-4 mr-2" />
                          Available Rates ({shipment.availableRates.length})
                        </h4>
                        {shipment.availableRates.map((rate) => (
                          <div
                            key={rate.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              selectedRate?.id === rate.id
                                ? 'border-green-400 bg-green-50 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                            onClick={() => onSelectRate(shipment.id, rate.id)}
                          >
                            <RateDisplay
                              actualRate={rate.rate}
                              carrier={rate.carrier}
                              service={rate.service}
                              deliveryDays={rate.delivery_days}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No rates available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRefreshRates(shipment.id)}
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    )}

                    {/* Shipment Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditShipment(shipment.id, shipment.details)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveShipment(shipment.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredShipments.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
          <p className="text-gray-500">
            {searchTerm || carrierFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Upload a CSV file to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkShipmentsList;
