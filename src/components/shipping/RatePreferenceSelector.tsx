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
  return;
};
export default RatePreferenceSelector;