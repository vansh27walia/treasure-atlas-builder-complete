import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Globe, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import ShippingRates from '../ShippingRates';

interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  company?: string;
  email?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface CustomsItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
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
}

const EnhancedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCustoms, setShowCustoms] = useState(false);
  const [fromAddress, setFromAddress] = useState<Address>({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    company: '',
    email: ''
  });
  
  const [toAddress, setToAddress] = useState<Address>({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    company: '',
    email: ''
  });
  
  const [parcel, setParcel] = useState<Parcel>({
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  });

  const [customsInfo, setCustomsInfo] = useState<CustomsInfo>({
    contents_type: 'merchandise',
    contents_explanation: '',
    customs_certify: false,
    customs_signer: '',
    non_delivery_option: 'return',
    restriction_type: '',
    restriction_comments: '',
    customs_items: [
      {
        description: '',
        quantity: 1,
        weight: 0,
        value: 0,
        hs_tariff_number: '',
        origin_country: 'US'
      }
    ]
  });

  // Check if shipping is international
  useEffect(() => {
    const isInternational = fromAddress.country !== toAddress.country;
    setShowCustoms(isInternational);
    
    if (isInternational && !customsInfo.customs_signer) {
      setCustomsInfo(prev => ({
        ...prev,
        customs_signer: fromAddress.name || 'Sender'
      }));
    }
  }, [fromAddress.country, toAddress.country, fromAddress.name]);

  // Listen for auto-fill from rate calculator
  useEffect(() => {
    const handleAutoFill = (event: CustomEvent) => {
      const { fromAddress: calcFromAddress, toAddress: calcToAddress, parcel: calcParcel } = event.detail;
      
      if (calcFromAddress) {
        setFromAddress(calcFromAddress);
      }
      
      if (calcToAddress) {
        setToAddress(calcToAddress);
      }
      
      if (calcParcel) {
        setParcel({
          length: parseFloat(calcParcel.dimensions.length) || 0,
          width: parseFloat(calcParcel.dimensions.width) || 0,
          height: parseFloat(calcParcel.dimensions.height) || 0,
          weight: parseFloat(calcParcel.dimensions.weight) || 0
        });
      }
      
      toast.success('Form pre-filled with rate calculator data');
    };

    document.addEventListener('prefill-shipping-form', handleAutoFill as EventListener);
    return () => document.removeEventListener('prefill-shipping-form', handleAutoFill as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAddress.name || !fromAddress.street1 || !fromAddress.city || !fromAddress.state || !fromAddress.zip) {
      toast.error('Please fill in all required from address fields');
      return;
    }
    
    if (!toAddress.name || !toAddress.street1 || !toAddress.city || !toAddress.state || !toAddress.zip) {
      toast.error('Please fill in all required to address fields');
      return;
    }
    
    if (!parcel.length || !parcel.width || !parcel.height || !parcel.weight) {
      toast.error('Please fill in all parcel dimensions and weight');
      return;
    }

    if (showCustoms) {
      if (!customsInfo.customs_signer || !customsInfo.customs_certify) {
        toast.error('Please complete customs information for international shipments');
        return;
      }
      
      const hasValidItems = customsInfo.customs_items.every(item => 
        item.description && item.quantity > 0 && item.weight > 0 && item.value > 0
      );
      
      if (!hasValidItems) {
        toast.error('Please complete all customs items information');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const payload = {
        fromAddress,
        toAddress,
        parcel,
        ...(showCustoms && { customsInfo }),
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      console.log('Enhanced shipping form payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        // Process rates with discount logic
        const processedRates = data.rates.map((rate: any) => {
          const discountPercentage = Math.random() * (90 - 85) + 85;
          const actualRate = parseFloat(rate.rate);
          const inflatedRate = (actualRate * (100 / (100 - discountPercentage))).toFixed(2);
          
          return {
            ...rate,
            original_rate: inflatedRate,
            shipment_id: data.shipmentId
          };
        });

        // Dispatch rates event
        document.dispatchEvent(new CustomEvent('easypost-rates-received', {
          detail: {
            rates: processedRates,
            shipmentId: data.shipmentId
          }
        }));
        
        toast.success(`Found ${processedRates.length} shipping options!`);
      } else {
        toast.info('No rates available for this shipment');
      }
    } catch (error) {
      console.error('Error in enhanced shipping form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomsItem = () => {
    setCustomsInfo(prev => ({
      ...prev,
      customs_items: [
        ...prev.customs_items,
        {
          description: '',
          quantity: 1,
          weight: 0,
          value: 0,
          hs_tariff_number: '',
          origin_country: 'US'
        }
      ]
    }));
  };

  const removeCustomsItem = (index: number) => {
    setCustomsInfo(prev => ({
      ...prev,
      customs_items: prev.customs_items.filter((_, i) => i !== index)
    }));
  };

  const updateCustomsItem = (index: number, field: keyof CustomsItem, value: any) => {
    setCustomsInfo(prev => ({
      ...prev,
      customs_items: prev.customs_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              From Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromName">Full Name *</Label>
                <Input
                  id="fromName"
                  value={fromAddress.name}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fromCompany">Company</Label>
                <Input
                  id="fromCompany"
                  value={fromAddress.company}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="fromStreet1">Street Address *</Label>
              <Input
                id="fromStreet1"
                value={fromAddress.street1}
                onChange={(e) => setFromAddress(prev => ({ ...prev, street1: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="fromStreet2">Street Address 2</Label>
              <Input
                id="fromStreet2"
                value={fromAddress.street2}
                onChange={(e) => setFromAddress(prev => ({ ...prev, street2: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fromCity">City *</Label>
                <Input
                  id="fromCity"
                  value={fromAddress.city}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fromState">State *</Label>
                <Input
                  id="fromState"
                  value={fromAddress.state}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fromZip">ZIP Code *</Label>
                <Input
                  id="fromZip"
                  value={fromAddress.zip}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, zip: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fromCountry">Country *</Label>
                <Select 
                  value={fromAddress.country} 
                  onValueChange={(value) => setFromAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fromPhone">Phone</Label>
                <Input
                  id="fromPhone"
                  value={fromAddress.phone}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fromEmail">Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={fromAddress.email}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* To Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              To Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toName">Full Name *</Label>
                <Input
                  id="toName"
                  value={toAddress.name}
                  onChange={(e) => setToAddress(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="toCompany">Company</Label>
                <Input
                  id="toCompany"
                  value={toAddress.company}
                  onChange={(e) => setToAddress(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="toStreet1">Street Address *</Label>
              <Input
                id="toStreet1"
                value={toAddress.street1}
                onChange={(e) => setToAddress(prev => ({ ...prev, street1: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="toStreet2">Street Address 2</Label>
              <Input
                id="toStreet2"
                value={toAddress.street2}
                onChange={(e) => setToAddress(prev => ({ ...prev, street2: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="toCity">City *</Label>
                <Input
                  id="toCity"
                  value={toAddress.city}
                  onChange={(e) => setToAddress(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="toState">State *</Label>
                <Input
                  id="toState"
                  value={toAddress.state}
                  onChange={(e) => setToAddress(prev => ({ ...prev, state: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="toZip">ZIP Code *</Label>
                <Input
                  id="toZip"
                  value={toAddress.zip}
                  onChange={(e) => setToAddress(prev => ({ ...prev, zip: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="toCountry">Country *</Label>
                <Select 
                  value={toAddress.country} 
                  onValueChange={(value) => setToAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toPhone">Phone</Label>
                <Input
                  id="toPhone"
                  value={toAddress.phone}
                  onChange={(e) => setToAddress(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="toEmail">Email</Label>
                <Input
                  id="toEmail"
                  type="email"
                  value={toAddress.email}
                  onChange={(e) => setToAddress(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Length (in) *</Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  value={parcel.length || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in) *</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={parcel.width || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in) *</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={parcel.height || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (oz) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={parcel.weight || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customs Information (International Only) */}
        {showCustoms && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                Customs Information
                <Badge className="bg-orange-100 text-orange-800">International</Badge>
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <AlertCircle className="w-4 h-4" />
                <span>Required for international shipments</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contents Type *</Label>
                  <Select 
                    value={customsInfo.contents_type} 
                    onValueChange={(value) => setCustomsInfo(prev => ({ ...prev, contents_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="returned_goods">Returned Goods</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Non-Delivery Option *</Label>
                  <Select 
                    value={customsInfo.non_delivery_option} 
                    onValueChange={(value) => setCustomsInfo(prev => ({ ...prev, non_delivery_option: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="return">Return to Sender</SelectItem>
                      <SelectItem value="abandon">Abandon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Customs Signer *</Label>
                <Input
                  value={customsInfo.customs_signer}
                  onChange={(e) => setCustomsInfo(prev => ({ ...prev, customs_signer: e.target.value }))}
                  placeholder="Name of person certifying customs"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customsCertify"
                  checked={customsInfo.customs_certify}
                  onCheckedChange={(checked) => setCustomsInfo(prev => ({ ...prev, customs_certify: checked as boolean }))}
                />
                <Label htmlFor="customsCertify" className="text-sm">
                  I certify that the particulars given in this customs declaration are correct *
                </Label>
              </div>

              {/* Customs Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Customs Items</Label>
                  <Button type="button" onClick={addCustomsItem} size="sm">
                    Add Item
                  </Button>
                </div>
                
                {customsInfo.customs_items.map((item, index) => (
                  <Card key={index} className="mb-4 bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {customsInfo.customs_items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomsItem(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Description *</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>HS Tariff Number</Label>
                          <Input
                            value={item.hs_tariff_number}
                            onChange={(e) => updateCustomsItem(index, 'hs_tariff_number', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Weight (oz) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.weight}
                            onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Value (USD) *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.value}
                            onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Origin Country *</Label>
                          <Select 
                            value={item.origin_country} 
                            onValueChange={(value) => updateCustomsItem(index, 'origin_country', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="GB">United Kingdom</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                              <SelectItem value="CN">China</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Rates...
              </>
            ) : (
              'Get Shipping Rates'
            )}
          </Button>
        </div>
      </form>

      {/* Shipping Rates Display */}
      <ShippingRates />
    </div>
  );
};

export default EnhancedShippingForm;
