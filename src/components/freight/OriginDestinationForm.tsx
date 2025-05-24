
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plane } from 'lucide-react';
import CountrySelector from './CountrySelector';
import { FreightLocation } from '@/types/freight';

interface OriginDestinationFormProps {
  originData: FreightLocation;
  destinationData: FreightLocation;
  onOriginChange: (data: FreightLocation) => void;
  onDestinationChange: (data: FreightLocation) => void;
}

const locationTypes = [
  { value: 'port', label: 'Port', group: 'Transportation Hub' },
  { value: 'airport', label: 'Airport', group: 'Transportation Hub' },
  { value: 'factory', label: 'Factory', group: 'Facility' },
  { value: 'warehouse', label: 'Warehouse', group: 'Facility' },
  { value: 'office', label: 'Office', group: 'Facility' },
  { value: 'home', label: 'Home', group: 'Facility' }
];

const OriginDestinationForm: React.FC<OriginDestinationFormProps> = ({
  originData,
  destinationData,
  onOriginChange,
  onDestinationChange
}) => {
  const renderLocationForm = (
    title: string,
    icon: React.ReactNode,
    data: FreightLocation,
    onChange: (data: FreightLocation) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`${title.toLowerCase()}-type`}>Location Type *</Label>
          <Select
            value={data.locationType}
            onValueChange={(value) => onChange({ ...data, locationType: value })}
          >
            <SelectTrigger id={`${title.toLowerCase()}-type`}>
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <div className="py-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Transportation Hub
                </div>
                {locationTypes.filter(type => type.group === 'Transportation Hub').map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </div>
              <div className="py-2">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Facility
                </div>
                {locationTypes.filter(type => type.group === 'Facility').map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`${title.toLowerCase()}-country`}>Country *</Label>
          <CountrySelector
            value={data.country}
            onChange={(value) => onChange({ ...data, country: value })}
            placeholder="Select country"
          />
        </div>

        <div>
          <Label htmlFor={`${title.toLowerCase()}-address`}>Address *</Label>
          <Input
            id={`${title.toLowerCase()}-address`}
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="Enter complete address"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {renderLocationForm('Origin', <MapPin className="w-5 h-5 text-green-600" />, originData, onOriginChange)}
      {renderLocationForm('Destination', <Plane className="w-5 h-5 text-blue-600" />, destinationData, onDestinationChange)}
    </div>
  );
};

export default OriginDestinationForm;
