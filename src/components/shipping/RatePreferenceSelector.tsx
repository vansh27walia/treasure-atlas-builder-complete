
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface RatePreferenceSelectorProps {
  onPreferenceSelect: (preference: string) => void;
}

const preferences = [
  { value: 'fastest', label: 'Fastest Delivery' },
  { value: 'cheapest', label: 'Cheapest Rate' },
  { value: 'reliable', label: 'Most Reliable' },
  { value: 'value', label: 'Best Value' },
];

const RatePreferenceSelector: React.FC<RatePreferenceSelectorProps> = ({
  onPreferenceSelect,
}) => {
  const [selectedPreference, setSelectedPreference] = useState<string>('');

  const handleApplyPreference = () => {
    if (selectedPreference) {
      onPreferenceSelect(selectedPreference);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">AI Rate Preference</Label>
      <Select onValueChange={setSelectedPreference}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select preference" />
        </SelectTrigger>
        <SelectContent>
          {preferences.map((pref) => (
            <SelectItem key={pref.value} value={pref.value}>
              {pref.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedPreference && (
        <Button 
          onClick={handleApplyPreference}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <Sparkles className="w-4 h-4" />
          Apply AI Selection
        </Button>
      )}
    </div>
  );
};

export default RatePreferenceSelector;
