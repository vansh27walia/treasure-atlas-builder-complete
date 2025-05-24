
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, Plane, Building2, Factory, Warehouse, Home, Anchor } from 'lucide-react';
import CountrySelector from './CountrySelector';
import AddressAutoComplete from '../shipping/AddressAutoComplete';
import { FreightLocation } from '@/types/freight';

interface OriginDestinationFormProps {
  originData: FreightLocation;
  destinationData: FreightLocation;
  onOriginChange: (data: FreightLocation) => void;
  onDestinationChange: (data: FreightLocation) => void;
}

const locationTypes = [
  { 
    value: 'port', 
    label: 'Seaport', 
    group: 'Transportation Hubs',
    icon: <Anchor className="w-4 h-4" />,
    description: 'Ocean freight terminals and harbors'
  },
  { 
    value: 'airport', 
    label: 'Airport', 
    group: 'Transportation Hubs',
    icon: <Plane className="w-4 h-4" />,
    description: 'Air cargo facilities and terminals'
  },
  { 
    value: 'rail_terminal', 
    label: 'Rail Terminal', 
    group: 'Transportation Hubs',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Railway freight terminals'
  },
  { 
    value: 'factory', 
    label: 'Manufacturing Facility', 
    group: 'Business Locations',
    icon: <Factory className="w-4 h-4" />,
    description: 'Production and manufacturing plants'
  },
  { 
    value: 'warehouse', 
    label: 'Warehouse / Distribution Center', 
    group: 'Business Locations',
    icon: <Warehouse className="w-4 h-4" />,
    description: 'Storage and fulfillment centers'
  },
  { 
    value: 'office', 
    label: 'Office / Commercial Building', 
    group: 'Business Locations',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Corporate offices and commercial spaces'
  },
  { 
    value: 'retail', 
    label: 'Retail Store', 
    group: 'Business Locations',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Shops, stores, and retail locations'
  },
  { 
    value: 'home', 
    label: 'Residential Address', 
    group: 'Personal Locations',
    icon: <Home className="w-4 h-4" />,
    description: 'Home delivery or pickup'
  }
];

const OriginDestinationForm: React.FC<OriginDestinationFormProps> = ({
  originData,
  destinationData,
  onOriginChange,
  onDestinationChange
}) => {
  const handleAddressSelect = (
    place: GoogleMapsPlace, 
    isOrigin: boolean
  ) => {
    const data = isOrigin ? originData : destinationData;
    const onChange = isOrigin ? onOriginChange : onDestinationChange;
    
    // Update with the selected address
    onChange({
      ...data,
      address: place.formatted_address || ''
    });
  };

  const renderLocationForm = (
    title: string,
    icon: React.ReactNode,
    data: FreightLocation,
    onChange: (data: FreightLocation) => void,
    isOrigin: boolean
  ) => (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-semibold">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            isOrigin ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {icon}
          </div>
          <div>
            <div>{title}</div>
            <p className="text-sm font-normal text-gray-600 mt-1">
              {isOrigin ? 'Where is your cargo starting from?' : 'Where should we deliver your cargo?'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor={`${title.toLowerCase()}-type`} className="text-sm font-medium text-gray-700">
            Location Type *
          </Label>
          <Select
            value={data.locationType}
            onValueChange={(value) => onChange({ ...data, locationType: value })}
          >
            <SelectTrigger id={`${title.toLowerCase()}-type`} className="mt-2 h-12">
              <SelectValue placeholder="Choose your location type" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {['Transportation Hubs', 'Business Locations', 'Personal Locations'].map(group => (
                <div key={group} className="py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    {group}
                  </div>
                  {locationTypes.filter(type => type.group === group).map(type => (
                    <SelectItem key={type.value} value={type.value} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-500">
                          {type.icon}
                        </div>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`${title.toLowerCase()}-country`} className="text-sm font-medium text-gray-700">
            Country / Region *
          </Label>
          <div className="mt-2">
            <CountrySelector
              value={data.country}
              onChange={(value) => onChange({ ...data, country: value })}
              placeholder="Select your country"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`${title.toLowerCase()}-address`} className="text-sm font-medium text-gray-700">
            Complete Address *
          </Label>
          <div className="mt-2">
            <AddressAutoComplete
              onAddressSelected={(place) => handleAddressSelect(place, isOrigin)}
              placeholder="Start typing your address for suggestions..."
              defaultValue={data.address}
              onChange={(value) => onChange({ ...data, address: value })}
              className="h-12"
              id={`${title.toLowerCase()}-address`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Include building name, suite number, and any special delivery instructions
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Route</h2>
        <p className="text-gray-600">Tell us where your cargo needs to go</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {renderLocationForm(
          'Origin', 
          <MapPin className="w-5 h-5" />, 
          originData, 
          onOriginChange,
          true
        )}
        {renderLocationForm(
          'Destination', 
          <Plane className="w-5 h-5" />, 
          destinationData, 
          onDestinationChange,
          false
        )}
      </div>

      {/* Route Summary */}
      {originData.address && destinationData.address && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Route Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">From:</span>
              <span className="ml-2 text-gray-900">{originData.address}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">To:</span>
              <span className="ml-2 text-gray-900">{destinationData.address}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OriginDestinationForm;
