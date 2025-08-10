
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';

interface HazmatCalculatorProps {
  onHazmatChange: (enabled: boolean) => void;
  hideFromRates?: boolean;
}

const HazmatCalculator: React.FC<HazmatCalculatorProps> = ({
  onHazmatChange,
  hideFromRates = false
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    onHazmatChange(isEnabled);
  }, [isEnabled, onHazmatChange]);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
  };

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
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              HAZMAT
            </Badge>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {isEnabled && (
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Hazardous Materials Enabled</p>
              <p className="text-xs text-orange-600">
                Your package contains hazardous materials. Additional regulations and fees may apply.
                Please ensure proper packaging and labeling.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isEnabled && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            No hazardous materials in this shipment.
          </p>
        </div>
      )}
    </Card>
  );
};

export default HazmatCalculator;
