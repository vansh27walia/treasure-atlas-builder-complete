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
  return;
};
export default HazmatCalculator;