
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

interface HazmatSelectorProps {
  isHazmat: boolean;
  hazmatType: string;
  onHazmatChange: (isHazmat: boolean) => void;
  onHazmatTypeChange: (type: string) => void;
}

const hazmatTypes = [
  { value: 'LITHIUM', label: 'Lithium Batteries' },
  { value: 'CLASS_8_CORROSIVE', label: 'Corrosive Materials' },
  { value: 'CLASS_3_FLAMMABLE', label: 'Flammable Liquids' },
  { value: 'CLASS_9_MISC', label: 'Miscellaneous Dangerous Goods' },
  { value: 'DRY_ICE', label: 'Dry Ice' },
  { value: 'RADIOACTIVE', label: 'Radioactive Materials' },
];

const HazmatSelector: React.FC<HazmatSelectorProps> = ({
  isHazmat,
  hazmatType,
  onHazmatChange,
  onHazmatTypeChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <Label className="text-base font-medium text-orange-800">Hazardous Materials</Label>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="hazmat" className="text-sm font-medium">
          Hazardous materials
        </Label>
        <Switch id="hazmat" checked={isHazmat} onCheckedChange={onHazmatChange} />
      </div>

      {isHazmat && (
        <div className="space-y-2">
          <Label className="text-sm">Hazmat Type</Label>
          <Select value={hazmatType} onValueChange={onHazmatTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select hazmat type" />
            </SelectTrigger>
            <SelectContent>
              {hazmatTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default HazmatSelector;
