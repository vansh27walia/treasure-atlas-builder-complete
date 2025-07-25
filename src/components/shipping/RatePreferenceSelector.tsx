
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

interface RatePreferenceSelectorProps {
  onPreferenceSelect: (preference: string) => void;
}

const preferences = [{
  value: 'fastest',
  label: 'Fastest Delivery'
}, {
  value: 'cheapest',
  label: 'Cheapest Rate'
}, {
  value: 'reliable',
  label: 'Most Reliable'
}, {
  value: 'value',
  label: 'Best Value'
}];

const RatePreferenceSelector: React.FC<RatePreferenceSelectorProps> = ({
  onPreferenceSelect
}) => {
  const [selectedPreference, setSelectedPreference] = useState<string>('');

  const handleApplyPreference = () => {
    if (selectedPreference) {
      onPreferenceSelect(selectedPreference);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <Label className="text-lg font-semibold text-blue-900">AI Rate Preferences</Label>
      </div>
      
      <div className="flex items-center gap-4">
        <Select value={selectedPreference} onValueChange={setSelectedPreference}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select preference" />
          </SelectTrigger>
          <SelectContent>
            {preferences.map((preference) => (
              <SelectItem key={preference.value} value={preference.value}>
                {preference.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleApplyPreference}
          disabled={!selectedPreference}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Apply Preference
        </Button>
      </div>
    </div>
  );
};

export default RatePreferenceSelector;
