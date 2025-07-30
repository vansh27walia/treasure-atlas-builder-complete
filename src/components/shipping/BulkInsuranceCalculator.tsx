
import React from 'react';
import { Shield, Info, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BulkInsuranceCalculatorProps {
  shipments: Array<{
    id: string;
    declaredValue?: number;
    calculatedInsurance?: number;
  }>;
  onInsuranceUpdate: (shipmentId: string, insurance: number) => void;
}

const BulkInsuranceCalculator: React.FC<BulkInsuranceCalculatorProps> = ({
  shipments,
  onInsuranceUpdate
}) => {
  
  const calculateInsurance = (declaredValue: number | undefined): number => {
    // Handle undefined, null, or 0 values
    const value = declaredValue || 100; // Default to $100 if not specified
    
    // $2 per $100 of declared value, with minimum $2
    const baseInsurance = Math.max(2, Math.ceil((value / 100) * 2));
    
    // Cap at $200 maximum
    return Math.min(baseInsurance, 200);
  };

  const totalInsurance = shipments.reduce((total, shipment) => {
    return total + calculateInsurance(shipment.declaredValue);
  }, 0);

  const totalDeclaredValue = shipments.reduce((total, shipment) => {
    return total + (shipment.declaredValue || 100);
  }, 0);

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Shield className="w-5 h-5" />
          Bulk Insurance Calculator
          <Badge className="bg-blue-100 text-blue-800">
            Auto-calculated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <div className="text-lg font-bold text-green-800">
              ${totalDeclaredValue.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Total Insurance</span>
            </div>
            <div className="text-lg font-bold text-blue-800">
              ${totalInsurance.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-sm font-medium mb-1">Shipments</div>
            <div className="text-lg font-bold text-gray-800">
              {shipments.length}
            </div>
          </div>
        </div>

        {/* Insurance Rules */}
        <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Auto Insurance Rules:</p>
              <ul className="space-y-1 text-xs">
                <li>• $2 per $100 declared value (minimum $2)</li>
                <li>• Maximum insurance: $200 per shipment</li>
                <li>• Blank/zero values default to $100 → $2 insurance</li>
                <li>• Examples: $150 → $4, $350 → $4 (capped), $0 → $2</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Individual Shipment Breakdown (if not too many) */}
        {shipments.length <= 5 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Breakdown by Shipment:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {shipments.map((shipment, index) => {
                const declaredValue = shipment.declaredValue || 100;
                const insurance = calculateInsurance(shipment.declaredValue);
                
                return (
                  <div key={shipment.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <span className="font-medium">Shipment #{index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        Value: ${declaredValue.toFixed(2)}
                      </span>
                      <Badge variant="outline" className="text-blue-600">
                        Insurance: ${insurance.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkInsuranceCalculator;
