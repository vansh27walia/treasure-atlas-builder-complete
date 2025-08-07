
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles } from 'lucide-react';
import { BulkShipment, Rate } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis?: (shipment?: BulkShipment) => void;
}

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 10, 15, 20, etc.

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments = [], // Add default empty array
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis
}) => {
  // Add early return if shipments is null or undefined
  if (!shipments || !Array.isArray(shipments)) {
    console.log('BulkShipmentsList: shipments is not a valid array:', shipments);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Shipments (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No shipments available to review.</p>
        </CardContent>
      </Card>
    );
  }

  const getAIRecommendedRate = (rates: Rate[]): Rate | null => {
    if (!rates || rates.length === 0) return null;
    
    // Find the rate with the best balance of price and speed
    const scoredRates = rates.map(rate => {
      const priceScore = 1 / parseFloat(rate.rate.toString());
      const speedScore = 1 / (rate.delivery_days || 7);
      const totalScore = priceScore * 0.6 + speedScore * 0.4;
      return { ...rate, score: totalScore };
    });
    
    return scoredRates.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const formatDiscountPercentage = (originalRate: string, finalRate: string): string => {
    const original = parseFloat(originalRate);
    const final = parseFloat(finalRate);
    if (original > final) {
      const discountPercent = ((original - final) / original) * 100;
      return `${discountPercent.toFixed(0)}%`;
    }
    return `${RATE_MARKUP_PERCENTAGE}%`;
  };

  const renderRateSelector = (shipment: BulkShipment) => {
    if (!shipment.availableRates || shipment.availableRates.length === 0) {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">Loading rates...</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRefreshRates(shipment.id)}
            disabled={isFetchingRates}
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      );
    }

    const aiRecommendedRate = getAIRecommendedRate(shipment.availableRates);

    return (
      <div className="space-y-2">
        <Select
          value={shipment.selectedRateId || ''}
          onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
        >
          <SelectTrigger className="w-80 h-10">
            <SelectValue placeholder="Select shipping rate" />
          </SelectTrigger>
          <SelectContent className="w-80 max-h-60 overflow-y-auto bg-white border shadow-lg z-50">
            {shipment.availableRates.map((rate) => {
              const isAIRecommended = aiRecommendedRate?.id === rate.id;
              const originalRate = (rate as any).original_rate || rate.rate;
              const discountPercent = formatDiscountPercentage(originalRate, rate.rate.toString());
              
              return (
                <SelectItem 
                  key={rate.id} 
                  value={rate.id}
                  className="py-3 px-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{rate.carrier}</span>
                        <span className="text-sm text-gray-600">{rate.service}</span>
                        {isAIRecommended && (
                          <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Recommended</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{rate.delivery_days || 'N/A'} days</span>
                        {originalRate && originalRate !== rate.rate.toString() && (
                          <span className="line-through text-red-500">${originalRate}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${rate.rate}</div>
                      {discountPercent && (
                        <div className={`text-xs ${
                          parseFloat(originalRate) > parseFloat(rate.rate.toString()) 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`}>
                          {discountPercent} discount
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {shipment.selectedRateId && (
          <div className="flex items-center space-x-2">
            {aiRecommendedRate?.id === shipment.selectedRateId && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Recommended
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRefreshRates(shipment.id)}
              disabled={isFetchingRates}
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
            </Button>
            {onAIAnalysis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAIAnalysis(shipment)}
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Shipments ({shipments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Package Details</TableHead>
              <TableHead>Shipping Rate</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <EditableShipmentRow
                key={shipment.id}
                shipment={shipment}
                onSelectRate={onSelectRate}
                onRemoveShipment={onRemoveShipment}
                onEditShipment={onEditShipment}
                onRefreshRates={onRefreshRates}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BulkShipmentsList;
