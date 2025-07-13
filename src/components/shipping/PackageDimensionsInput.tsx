
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Ruler, Weight } from 'lucide-react';

interface PackageDimensionsInputProps {
  packageType: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  onLengthChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onWeightChange: (value: number) => void;
}

const PackageDimensionsInput: React.FC<PackageDimensionsInputProps> = ({
  packageType,
  length,
  width,
  height,
  weight,
  onLengthChange,
  onWidthChange,
  onHeightChange,
  onWeightChange,
}) => {
  const isCustomBox = packageType === 'custom_box';
  const isEnvelope = packageType === 'envelope';
  const isFlatRate = !isCustomBox && !isEnvelope;

  const showDimensions = isCustomBox || isEnvelope;
  const showHeight = isCustomBox; // Only custom boxes show height

  return (
    <Card className="p-6 space-y-4 border border-blue-200 bg-blue-50">
      <div className="flex items-center space-x-2 mb-4">
        <Ruler className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">
          {isFlatRate ? 'Package Weight' : 'Package Dimensions & Weight'}
        </h3>
      </div>

      {showDimensions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length" className="text-sm font-medium text-gray-700">
              Length (in)
            </Label>
            <Input
              id="length"
              type="number"
              min="0"
              step="0.1"
              value={length || ''}
              onChange={(e) => onLengthChange(parseFloat(e.target.value) || 0)}
              placeholder="0.0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="width" className="text-sm font-medium text-gray-700">
              Width (in)
            </Label>
            <Input
              id="width"
              type="number"
              min="0"
              step="0.1"
              value={width || ''}
              onChange={(e) => onWidthChange(parseFloat(e.target.value) || 0)}
              placeholder="0.0"
              className="mt-1"
            />
          </div>
          
          {showHeight && (
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                Height (in)
              </Label>
              <Input
                id="height"
                type="number"
                min="0"
                step="0.1"
                value={height || ''}
                onChange={(e) => onHeightChange(parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <Weight className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Weight (oz)
          </Label>
          <Input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={weight || ''}
            onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
            placeholder="0.0"
            className="mt-1"
          />
        </div>
      </div>

      {isFlatRate && (
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Flat Rate Package:</strong> Only weight is required. Dimensions are predefined by the carrier.
          </p>
        </div>
      )}
    </Card>
  );
};

export default PackageDimensionsInput;
