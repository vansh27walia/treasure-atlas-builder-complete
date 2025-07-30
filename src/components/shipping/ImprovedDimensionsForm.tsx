
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';

interface ImprovedDimensionsFormProps {
  length: string;
  width: string;
  height: string;
  weight: string;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
}

const ImprovedDimensionsForm: React.FC<ImprovedDimensionsFormProps> = ({
  length,
  width,
  height,
  weight,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onWeightChange
}) => {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5 text-blue-600" />
          Package Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight */}
        <div>
          <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Weight (lbs)
          </Label>
          <Input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder="Enter weight"
            className="mt-1"
            min="0"
            step="0.1"
          />
        </div>

        {/* Dimensions Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="length" className="text-sm font-medium text-gray-700">
              Length (in)
            </Label>
            <Input
              id="length"
              type="number"
              value={length}
              onChange={(e) => onLengthChange(e.target.value)}
              placeholder="L"
              className="mt-1"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="width" className="text-sm font-medium text-gray-700">
              Width (in)
            </Label>
            <Input
              id="width"
              type="number"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              placeholder="W"
              className="mt-1"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-sm font-medium text-gray-700">
              Height (in)
            </Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              placeholder="H"
              className="mt-1"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p>📦 Enter accurate dimensions for the best shipping rates</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedDimensionsForm;
