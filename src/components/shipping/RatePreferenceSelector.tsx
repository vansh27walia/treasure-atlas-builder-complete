
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
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <Label className="text-lg font-semibold">AI Rate Preference</Label>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Let AI optimize your shipping rates based on your preference
      </p>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Select value={selectedPreference} onValueChange={setSelectedPreference}>
            <SelectTrigger>
              <SelectValue placeholder="Select your preference" />
            </SelectTrigger>
            <SelectContent>
              {preferences.map((preference) => (
                <SelectItem key={preference.value} value={preference.value}>
                  {preference.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleApplyPreference}
          disabled={!selectedPreference}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Apply Preference
        </Button>
      </div>
    </div>
  );
};

export default RatePreferenceSelector;
