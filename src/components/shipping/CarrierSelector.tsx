import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';
interface CarrierSelectorProps {
  selectedCarriers: string[];
  onCarrierChange: (carriers: string[]) => void;
}
const carriers = [{
  id: 'usps',
  name: 'USPS',
  color: 'bg-blue-600',
  description: 'US Postal Service'
}, {
  id: 'ups',
  name: 'UPS',
  color: 'bg-yellow-600',
  description: 'United Parcel Service'
}, {
  id: 'fedex',
  name: 'FedEx',
  color: 'bg-purple-600',
  description: 'Federal Express'
}, {
  id: 'dhl',
  name: 'DHL',
  color: 'bg-red-600',
  description: 'DHL Express'
}];
const CarrierSelector: React.FC<CarrierSelectorProps> = ({
  selectedCarriers,
  onCarrierChange
}) => {
  const [selected, setSelected] = useState<string[]>(selectedCarriers);
  const handleCarrierToggle = (carrierId: string) => {
    const newSelected = selected.includes(carrierId) ? selected.filter(id => id !== carrierId) : [...selected, carrierId];
    setSelected(newSelected);
    onCarrierChange(newSelected);
  };
  return;
};
export default CarrierSelector;