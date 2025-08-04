
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plane } from 'lucide-react';
import PortSelector from './PortSelector';

interface SimplifiedLocationData {
  portName: string;
  country: string;
}

interface SimplifiedOriginDestinationFormProps {
  originData: SimplifiedLocationData;
  destinationData: SimplifiedLocationData;
  onOriginChange: (data: SimplifiedLocationData) => void;
  onDestinationChange: (data: SimplifiedLocationData) => void;
}

const SimplifiedOriginDestinationForm: React.FC<SimplifiedOriginDestinationFormProps> = ({
  originData,
  destinationData,
  onOriginChange,
  onDestinationChange
}) => {
  const renderLocationForm = (
    title: string,
    icon: React.ReactNode,
    data: SimplifiedLocationData,
    onChange: (data: SimplifiedLocationData) => void,
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
              {isOrigin ? 'Select your cargo origin port or airport' : 'Select your cargo destination port or airport'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PortSelector
          label="Port or Airport"
          value={data.portName}
          onChange={(portName, country) => onChange({ portName, country })}
          placeholder="Search for ports and airports..."
        />

        <div>
          <Label htmlFor={`${title.toLowerCase()}-country`} className="text-sm font-medium text-gray-700">
            Country *
          </Label>
          <Input
            id={`${title.toLowerCase()}-country`}
            value={data.country}
            readOnly
            className="mt-2 h-12 bg-gray-50 text-gray-600"
            placeholder="Auto-filled when you select a port/airport"
          />
          <p className="text-xs text-gray-500 mt-1">
            This field is automatically filled based on your port/airport selection
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Route</h2>
        <p className="text-gray-600">Select your origin and destination ports or airports</p>
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
      {originData.portName && destinationData.portName && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Selected Route
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">From:</span>
              <span className="ml-2 text-gray-900">{originData.portName}, {originData.country}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">To:</span>
              <span className="ml-2 text-gray-900">{destinationData.portName}, {destinationData.country}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedOriginDestinationForm;
