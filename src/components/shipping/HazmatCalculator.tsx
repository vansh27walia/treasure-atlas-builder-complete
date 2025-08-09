
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface HazmatCalculatorProps {
  onHazmatChange: (enabled: boolean) => void;
  hideFromRates?: boolean; // New prop to hide during rate fetching
}

const HazmatCalculator: React.FC<HazmatCalculatorProps> = ({
  onHazmatChange,
  hideFromRates = false
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Notify parent component of changes
  useEffect(() => {
    onHazmatChange(isEnabled);
  }, [isEnabled, onHazmatChange]);

  // Don't render during rate fetching if hideFromRates is true
  if (hideFromRates) {
    return null;
  }

  return (
    <Card className="p-4 border border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Hazardous Materials</h3>
          {isEnabled && (
            <Badge variant="destructive" className="bg-orange-100 text-orange-800">
              HAZMAT
            </Badge>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
      </div>

      {isEnabled && (
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Hazardous Material Declaration</p>
              <p className="text-xs text-orange-600">
                Package contains hazardous materials requiring special handling and documentation.
                Additional fees and restrictions may apply.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isEnabled && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            No hazardous materials in this package.
          </p>
        </div>
      )}
    </Card>
  );
};

export default HazmatCalculator;
