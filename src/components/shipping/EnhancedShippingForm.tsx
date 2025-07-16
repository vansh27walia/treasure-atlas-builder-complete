import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Package, Search, Loader2, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import ShippingRates from '../ShippingRates';
import CustomsDocumentationModal from './CustomsDocumentationModal';

interface AddressData {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface ParcelData {
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
}

interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  hs_tariff_number?: string;
  origin_country: string;
}

interface CustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type?: string;
  restriction_comments?: string;
  customs_items: CustomsItem[];
  eel_pfc?: string;
}

const EnhancedShippingForm: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<AddressData>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });
  const [toAddress, setToAddress] = useState<AddressData>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });
  const [parcel, setParcel] = useState<ParcelData>({
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  const [weightUnit, setWeightUnit] = useState('lb');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [customsInfo, setCustomsInfo] = useState<CustomsInfo>({
    contents_type: 'merchandise',
    contents_explanation: '',
    customs_certify: true,
    customs_signer: '',
    non_delivery_option: 'return',
    restriction_type: 'none',
    restriction_comments: '',
    customs_items: [{
      description: '',
      quantity: 1,
      value: 0,
      weight: 0,
      hs_tariff_number: '',
      origin_country: 'US'
    }],
    eel_pfc: ''
  });

  // Enhanced function to handle address changes and trigger customs documentation
  const handleAddressChange = (addressType: 'from' | 'to', field: string, value: string) => {
    if (addressType === 'from') {
      setFromAddress(prev => ({ ...prev, [field]: value }));
    } else {
      setToAddress(prev => ({ ...prev, [field]: value }));
      
      // Check if this address change makes it international and trigger customs modal
      if (field === 'country' && value !== 'US' && fromAddress.country === 'US') {
        console.log('International shipping detected, opening customs modal');
        setTimeout(() => {
          setShowCustomsModal(true);
        }, 500); // Small delay to let the UI update
      }
    }
  };

  const handleCustomsSave = (data: CustomsInfo) => {
    setCustomsInfo(data);
    setShowCustomsModal(false);
    toast.success('Customs information saved');
  };

  const handleCustomsCancel = () => {
    setShowCustomsModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAddress.street1 || !toAddress.street1) {
      toast.error('Please fill in all required address fields');
      return;
    }
    
    if (!parcel.weight) {
      toast.error('Please enter package weight');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert weight to ounces for EasyPost
      let weightOz = parseFloat(parcel.weight.toString());
      if (weightUnit === 'kg') {
        weightOz = weightOz * 35.274;
      } else if (weightUnit === 'lb') {
        weightOz = weightOz * 16;
      }

      // Build parcel object
      const parcelData: any = { weight: weightOz };
      
      if (parcel.length && parcel.width) {
        parcelData.length = parseFloat(parcel.length.toString());
        parcelData.width = parseFloat(parcel.width.toString());
        if (parcel.height) {
          parcelData.height = parseFloat(parcel.height.toString());
        }
      }

      const requestData = {
        fromAddress,
        toAddress,
        parcel: parcelData,
        carriers: ['usps', 'ups', 'fedex', 'dhl'], // Request all carriers
        options: {
          label_format: 'PDF'
        }
      };

      console.log('Submitting shipping request:', requestData);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data && data.rates) {
        console.log('Received rates:', data.rates);
        
        // Dispatch event for ShippingRates component
        document.dispatchEvent(new CustomEvent('easypost-rates-received', {
          detail: {
            rates: data.rates,
            shipmentId: data.shipmentId
          }
        }));
        
        toast.success(`Found ${data.rates.length} shipping options!`);
        
        // Scroll to rates section
        setTimeout(() => {
          const ratesSection = document.getElementById('shipping-rates-section');
          if (ratesSection) {
            ratesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      } else {
        toast.error('No shipping rates found');
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Create Shipping Label</CardTitle>
          <p className="text-sm text-gray-600">Enter shipment details to get rates and create your label</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                From Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-name">Name *</Label>
                  <Input
                    id="from-name"
                    value={fromAddress.name}
                    onChange={(e) => handleAddressChange('from', 'name', e.target.value)}
                    placeholder="Enter sender name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-company">Company</Label>
                  <Input
                    id="from-company"
                    value={fromAddress.company}
                    onChange={(e) => handleAddressChange('from', 'company', e.target.value)}
                    placeholder="Company name (optional)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="from-street1">Street Address *</Label>
                  <Input
                    id="from-street1"
                    value={fromAddress.street1}
                    onChange={(e) => handleAddressChange('from', 'street1', e.target.value)}
                    placeholder="Enter street address"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="from-street2">Street Address 2</Label>
                  <Input
                    id="from-street2"
                    value={fromAddress.street2}
                    onChange={(e) => handleAddressChange('from', 'street2', e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-city">City *</Label>
                  <Input
                    id="from-city"
                    value={fromAddress.city}
                    onChange={(e) => handleAddressChange('from', 'city', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-state">State/Province *</Label>
                  <Input
                    id="from-state"
                    value={fromAddress.state}
                    onChange={(e) => handleAddressChange('from', 'state', e.target.value)}
                    placeholder="Enter state/province"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-zip">ZIP/Postal Code *</Label>
                  <Input
                    id="from-zip"
                    value={fromAddress.zip}
                    onChange={(e) => handleAddressChange('from', 'zip', e.target.value)}
                    placeholder="Enter ZIP/postal code"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="from-country">Country *</Label>
                  <Select value={fromAddress.country} onValueChange={(value) => handleAddressChange('from', 'country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="from-phone">Phone</Label>
                  <Input
                    id="from-phone"
                    value={fromAddress.phone}
                    onChange={(e) => handleAddressChange('from', 'phone', e.target.value)}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            {/* To Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                To Address
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to-name">Name *</Label>
                  <Input
                    id="to-name"
                    value={toAddress.name}
                    onChange={(e) => handleAddressChange('to', 'name', e.target.value)}
                    placeholder="Enter recipient name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="to-company">Company</Label>
                  <Input
                    id="to-company"
                    value={toAddress.company}
                    onChange={(e) => handleAddressChange('to', 'company', e.target.value)}
                    placeholder="Company name (optional)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="to-street1">Street Address *</Label>
                  <Input
                    id="to-street1"
                    value={toAddress.street1}
                    onChange={(e) => handleAddressChange('to', 'street1', e.target.value)}
                    placeholder="Enter street address"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="to-street2">Street Address 2</Label>
                  <Input
                    id="to-street2"
                    value={toAddress.street2}
                    onChange={(e) => handleAddressChange('to', 'street2', e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="to-city">City *</Label>
                  <Input
                    id="to-city"
                    value={toAddress.city}
                    onChange={(e) => handleAddressChange('to', 'city', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="to-state">State/Province *</Label>
                  <Input
                    id="to-state"
                    value={toAddress.state}
                    onChange={(e) => handleAddressChange('to', 'state', e.target.value)}
                    placeholder="Enter state/province"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="to-zip">ZIP/Postal Code *</Label>
                  <Input
                    id="to-zip"
                    value={toAddress.zip}
                    onChange={(e) => handleAddressChange('to', 'zip', e.target.value)}
                    placeholder="Enter ZIP/postal code"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="to-country">Country *</Label>
                  <Select value={toAddress.country} onValueChange={(value) => handleAddressChange('to', 'country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="to-phone">Phone</Label>
                  <Input
                    id="to-phone"
                    value={toAddress.phone}
                    onChange={(e) => handleAddressChange('to', 'phone', e.target.value)}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </div>
              </div>
            </div>

            {/* Customs Documentation Section - appears for international shipments */}
            {(fromAddress.country !== toAddress.country) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Customs Documentation
                </h3>
                
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-purple-800">International Shipping Detected</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        Customs documentation is required for shipments from {fromAddress.country} to {toAddress.country}
                      </p>
                      {customsInfo.customs_signer && (
                        <p className="text-sm text-gray-600 mt-2">
                          Current: {customsInfo.contents_type} - {customsInfo.customs_signer}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomsModal(true)}
                      className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Customs
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Package Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Package Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      placeholder=""
                      value={parcel.weight || ''}
                      onChange={(e) => setParcel(prev => ({ ...prev, weight: e.target.value }))}
                      className="flex-1"
                      min="0"
                      step="0.1"
                      required
                    />
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="length">Length (inches)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder=""
                    value={parcel.length || ''}
                    onChange={(e) => setParcel(prev => ({ ...prev, length: e.target.value }))}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder=""
                    value={parcel.width || ''}
                    onChange={(e) => setParcel(prev => ({ ...prev, width: e.target.value }))}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder=""
                    value={parcel.height || ''}
                    onChange={(e) => setParcel(prev => ({ ...prev, height: e.target.value }))}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Rates...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Get Shipping Rates
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onSubmit={handleCustomsSave}
        fromCountry={fromAddress.country}
        toCountry={toAddress.country}
        initialData={customsInfo}
      />
      
      {/* Shipping Rates Section */}
      <div id="shipping-rates-section">
        <ShippingRates />
      </div>
    </div>
  );
};

export default EnhancedShippingForm;
