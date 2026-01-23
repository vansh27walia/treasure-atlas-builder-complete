import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Edit, Check, Scale } from 'lucide-react';

interface Dimensions {
  weight: number;
  length: number;
  width: number;
  height: number;
  packageType?: string;
}

interface AIDimensionsCardProps {
  dimensions: Dimensions;
  onEdit?: () => void;
  onConfirm?: () => void;
  isConfirmed?: boolean;
}

const AIDimensionsCard: React.FC<AIDimensionsCardProps> = ({ 
  dimensions, 
  onEdit, 
  onConfirm,
  isConfirmed 
}) => {
  // Calculate dimensional weight
  const dimWeight = (dimensions.length * dimensions.width * dimensions.height) / 139;
  const billableWeight = Math.max(dimensions.weight, dimWeight);

  return (
    <Card className={`overflow-hidden transition-all ${isConfirmed ? 'ring-2 ring-green-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-500" />
            Package Details
          </h4>
          {isConfirmed && <Check className="w-5 h-5 text-green-500" />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Weight */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Weight</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{dimensions.weight} lbs</p>
          </div>

          {/* Dimensions */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">Size (L×W×H)</span>
            </div>
            <p className="text-lg font-bold text-purple-900">
              {dimensions.length}×{dimensions.width}×{dimensions.height}"
            </p>
          </div>
        </div>

        {/* Package Type & Billable Weight */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {dimensions.packageType || 'Custom Box'}
          </span>
          <span className="text-gray-600">
            Billable: <span className="font-medium">{billableWeight.toFixed(1)} lbs</span>
          </span>
        </div>

        {/* Dim Weight Notice */}
        {dimWeight > dimensions.weight && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-700">
            ⚠️ Dimensional weight ({dimWeight.toFixed(1)} lbs) exceeds actual weight
          </div>
        )}

        {(onEdit || onConfirm) && (
          <div className="mt-4 flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                <Edit className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
            {onConfirm && !isConfirmed && (
              <Button size="sm" onClick={onConfirm} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Check className="w-3 h-3 mr-1" /> Confirm
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDimensionsCard;
