
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackageType } from '@/types/shipping';

interface DynamicPackageFieldsProps {
  packageType: PackageType;
  length?: number;
  width?: number;
  height?: number;
  weight: number;
  onFieldChange: (field: string, value: number) => void;
}

const DynamicPackageFields: React.FC<DynamicPackageFieldsProps> = ({
  packageType,
  length = 0,
  width = 0,
  height = 0,
  weight = 0,
  onFieldChange
}) => {
  const showDimensions = packageType === 'custom' || packageType === 'envelope';
  const showHeight = packageType === 'custom';

  return (
    <div className="space-y-4">
      {/* Weight - always shown */}
      <div>
        <Label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-2 block">
          Weight (oz) *
        </Label>
        <Input
          id="weight"
          type="number"
          min="0.1"
          step="0.1"
          value={weight || ''}
          onChange={(e) => onFieldChange('weight', parseFloat(e.target.value) || 0)}
          placeholder="Enter weight in ounces"
          className="w-full"
          required
        />
      </div>

      {/* Dimensions - shown for custom and envelope */}
      {showDimensions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length" className="text-sm font-medium text-gray-700 mb-2 block">
              Length (in) *
            </Label>
            <Input
              id="length"
              type="number"
              min="0.1"
              step="0.1"
              value={length || ''}
              onChange={(e) => onFieldChange('length', parseFloat(e.target.value) || 0)}
              placeholder="Length"
              className="w-full"
              required
            />
          </div>

          <div>
            <Label htmlFor="width" className="text-sm font-medium text-gray-700 mb-2 block">
              Width (in) *
            </Label>
            <Input
              id="width"
              type="number"
              min="0.1"
              step="0.1"
              value={width || ''}
              onChange={(e) => onFieldChange('width', parseFloat(e.target.value) || 0)}
              placeholder="Width"
              className="w-full"
              required
            />
          </div>

          {showHeight && (
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-gray-700 mb-2 block">
                Height (in) *
              </Label>
              <Input
                id="height"
                type="number"
                min="0.1"
                step="0.1"
                value={height || ''}
                onChange={(e) => onFieldChange('height', parseFloat(e.target.value) || 0)}
                placeholder="Height"
                className="w-full"
                required
              />
            </div>
          )}
        </div>
      )}

      {/* Helpful hints */}
      <div className="text-xs text-gray-500 space-y-1">
        {packageType === 'custom' && (
          <p>💡 Measure your box's exterior dimensions for accurate rates</p>
        )}
        {packageType === 'envelope' && (
          <p>💡 For envelopes, height is not needed - just length and width</p>
        )}
        {packageType === 'flat-rate' && (
          <p>💡 Only weight is needed - carrier packaging determines size</p>
        )}
      </div>
    </div>
  );
};

export default DynamicPackageFields;
