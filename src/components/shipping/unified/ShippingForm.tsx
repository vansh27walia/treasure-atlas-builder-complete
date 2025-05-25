
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Ship, MapPin, Calendar, User, Phone, Mail, FileText, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { ShipmentType, ShippingFormData } from '@/types/unified-shipping';

interface ShippingFormProps {
  shipmentType: ShipmentType;
  formData: ShippingFormData;
  onFormDataChange: (data: ShippingFormData) => void;
  onGetRates: () => void;
  isLoading: boolean;
  testMode: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  shipmentType,
  formData,
  onFormDataChange,
  onGetRates,
  isLoading,
  testMode
}) => {
  const updateFormField = (field: keyof ShippingFormData, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const populateSampleData = () => {
    const sampleData: ShippingFormData = {
      ...formData,
      pickupAddress: '123 Warehouse St, Los Angeles, CA 90210',
      deliveryAddress: '456 Distribution Ave, Phoenix, AZ 85001',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      contactName: 'John Smith',
      contactPhone: '+1-555-123-4567',
      contactEmail: 'john.smith@example.com',
      insuranceRequired: true,
      specialInstructions: 'Please call before delivery. Loading dock access required.',
      handlingUnits: 2,
      unitType: 'Pallet',
      weightPerUnit: 1500,
      freightClass: '70',
      equipmentType: 'Dry Van',
      totalWeight: 25000,
      shipmentTitle: 'Industrial Machinery',
      materialType: 'Machinery',
      parcelCount: 1,
      weightPerParcel: 5000
    };
    onFormDataChange(sampleData);
    toast.success('Sample data loaded for testing');
  };

  const getShipmentTypeIcon = (type: ShipmentType) => {
    switch (type) {
      case 'LTL': return <Package className="h-5 w-5" />;
      case 'FTL': return <Truck className="h-5 w-5" />;
      case 'HEAVY_PARCEL': return <Ship className="h-5 w-5" />;
    }
  };

  const getShipmentTypeLabel = (type: ShipmentType) => {
    switch (type) {
      case 'LTL': return 'Less Than Truckload';
      case 'FTL': return 'Full Truckload';
      case 'HEAVY_PARCEL': return 'Heavy Parcel';
    }
  };

  return (
    <Card className="mb-6 shadow-lg border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getShipmentTypeIcon(shipmentType)}
            <span className="text-xl text-blue-800">
              {getShipmentTypeLabel(shipmentType)} Details
            </span>
            {testMode && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                TEST MODE
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={populateSampleData}
            className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
          >
            <Package className="h-4 w-4 mr-2" />
            Fill Sample Data
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Common Fields */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-xl font-semibold mb-6 flex items-center text-blue-800">
            <MapPin className="h-6 w-6 mr-3 text-blue-600" />
            Shipping Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                From (Pickup Address) *
              </Label>
              <AddressAutoComplete
                defaultValue={formData.pickupAddress}
                onAddressSelected={(place) => {
                  if (place?.formatted_address) {
                    updateFormField('pickupAddress', place.formatted_address);
                  }
                }}
                onChange={(value) => updateFormField('pickupAddress', value)}
                placeholder="Enter pickup address"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                To (Delivery Address) *
              </Label>
              <AddressAutoComplete
                defaultValue={formData.deliveryAddress}
                onAddressSelected={(place) => {
                  if (place?.formatted_address) {
                    updateFormField('deliveryAddress', place.formatted_address);
                  }
                }}
                onChange={(value) => updateFormField('deliveryAddress', value)}
                placeholder="Enter delivery address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Pickup Date
              </Label>
              <Input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => updateFormField('pickupDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Delivery Date
              </Label>
              <Input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => updateFormField('deliveryDate', e.target.value)}
                min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                className="border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Contact Name
              </Label>
              <Input
                value={formData.contactName}
                onChange={(e) => updateFormField('contactName', e.target.value)}
                placeholder="Your name"
                className="border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Phone Number
              </Label>
              <Input
                value={formData.contactPhone}
                onChange={(e) => updateFormField('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className="border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Email Address
              </Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormField('contactEmail', e.target.value)}
                placeholder="your@email.com"
                className="border-2 border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Shipment Type Specific Fields */}
        {shipmentType === 'LTL' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-xl font-semibold mb-6 text-green-800">LTL Freight Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Units</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.handlingUnits || 1}
                  onChange={(e) => updateFormField('handlingUnits', parseInt(e.target.value))}
                  className="border-2 border-gray-300 focus:border-green-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Unit Type</Label>
                <Select value={formData.unitType} onValueChange={(value) => updateFormField('unitType', value)}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pallet">Pallets</SelectItem>
                    <SelectItem value="Crate">Crates</SelectItem>
                    <SelectItem value="Drum">Drums</SelectItem>
                    <SelectItem value="Box">Boxes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight/Unit (lbs)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.weightPerUnit || 100}
                  onChange={(e) => updateFormField('weightPerUnit', parseFloat(e.target.value))}
                  className="border-2 border-gray-300 focus:border-green-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Freight Class</Label>
                <Select value={formData.freightClass} onValueChange={(value) => updateFormField('freightClass', value)}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">Class 50</SelectItem>
                    <SelectItem value="55">Class 55</SelectItem>
                    <SelectItem value="60">Class 60</SelectItem>
                    <SelectItem value="65">Class 65</SelectItem>
                    <SelectItem value="70">Class 70</SelectItem>
                    <SelectItem value="77.5">Class 77.5</SelectItem>
                    <SelectItem value="85">Class 85</SelectItem>
                    <SelectItem value="92.5">Class 92.5</SelectItem>
                    <SelectItem value="100">Class 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.liftgateRequired || false}
                  onCheckedChange={(checked) => updateFormField('liftgateRequired', checked)}
                />
                <Label className="text-sm">Liftgate Required</Label>
              </div>
            </div>
          </div>
        )}

        {shipmentType === 'FTL' && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-xl font-semibold mb-6 text-blue-800">Full Truckload Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Equipment Type</Label>
                <Select value={formData.equipmentType} onValueChange={(value) => updateFormField('equipmentType', value)}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dry Van">Dry Van (53ft)</SelectItem>
                    <SelectItem value="Flatbed">Flatbed</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated (Reefer)</SelectItem>
                    <SelectItem value="Step Deck">Step Deck</SelectItem>
                    <SelectItem value="Lowboy">Lowboy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Total Weight (lbs)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.totalWeight || 25000}
                  onChange={(e) => updateFormField('totalWeight', parseFloat(e.target.value))}
                  className="border-2 border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {shipmentType === 'HEAVY_PARCEL' && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-xl font-semibold mb-6 text-purple-800">Heavy Parcel Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Shipment Description</Label>
                <Input
                  value={formData.shipmentTitle || ''}
                  onChange={(e) => updateFormField('shipmentTitle', e.target.value)}
                  placeholder="Describe what you're shipping"
                  className="border-2 border-gray-300 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Material Type</Label>
                <Select value={formData.materialType} onValueChange={(value) => updateFormField('materialType', value)}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-purple-500">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Machinery">Machinery</SelectItem>
                    <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Construction Materials">Construction Materials</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Number of Pieces</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.parcelCount || 1}
                  onChange={(e) => updateFormField('parcelCount', parseInt(e.target.value))}
                  className="border-2 border-gray-300 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight per Piece (lbs)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.weightPerParcel || 500}
                  onChange={(e) => updateFormField('weightPerParcel', parseFloat(e.target.value))}
                  className="border-2 border-gray-300 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.insuranceRequired}
              onCheckedChange={(checked) => updateFormField('insuranceRequired', checked)}
            />
            <Label className="text-sm font-semibold text-gray-700">
              Add insurance coverage
            </Label>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Special Instructions (Optional)
            </Label>
            <Textarea
              value={formData.specialInstructions}
              onChange={(e) => updateFormField('specialInstructions', e.target.value)}
              placeholder="Any special handling requirements, delivery instructions, etc."
              rows={3}
              className="border-2 border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onGetRates}
            disabled={isLoading}
            size="lg"
            className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Getting Rates...
              </>
            ) : (
              <>
                <Truck className="h-5 w-5 mr-3" />
                Get Shipping Rates
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingForm;
