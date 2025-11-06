import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface ToggleableCustomsClearanceProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const ToggleableCustomsClearance: React.FC<ToggleableCustomsClearanceProps> = ({ enabled, onToggle }) => {
  return (
    <Card className={`p-4 border transition-all ${enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Info className={`w-5 h-5 ${enabled ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="font-semibold text-gray-900">Customs Clearance</h3>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled ? (
        <p className="text-sm text-blue-700">Required for international shipments. We’ll collect item details next.</p>
      ) : (
        <p className="text-sm text-gray-500">Enable to provide customs details for cross-border shipping.</p>
      )}
    </Card>
  );
};

export default ToggleableCustomsClearance;
