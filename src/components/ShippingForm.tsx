
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Box, ArrowRight, Scale } from 'lucide-react';

const ShippingForm: React.FC = () => {
  const [shippingMethod, setShippingMethod] = useState('usps');
  
  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Ship a Package</h2>
          
          <Tabs defaultValue="domestic" className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="domestic">Domestic</TabsTrigger>
              <TabsTrigger value="international">International</TabsTrigger>
            </TabsList>
            
            <TabsContent value="domestic" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Origin Address</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="from-name">Name</Label>
                      <Input id="from-name" placeholder="Name" />
                    </div>
                    <div>
                      <Label htmlFor="from-company">Company (optional)</Label>
                      <Input id="from-company" placeholder="Company" />
                    </div>
                    <div>
                      <Label htmlFor="from-address1">Address Line 1</Label>
                      <Input id="from-address1" placeholder="Street address" />
                    </div>
                    <div>
                      <Label htmlFor="from-address2">Address Line 2 (optional)</Label>
                      <Input id="from-address2" placeholder="Apt, Suite, Unit, etc." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="from-city">City</Label>
                        <Input id="from-city" placeholder="City" />
                      </div>
                      <div>
                        <Label htmlFor="from-state">State</Label>
                        <Input id="from-state" placeholder="State" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="from-zip">ZIP Code</Label>
                      <Input id="from-zip" placeholder="ZIP Code" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Destination Address</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="to-name">Name</Label>
                      <Input id="to-name" placeholder="Name" />
                    </div>
                    <div>
                      <Label htmlFor="to-company">Company (optional)</Label>
                      <Input id="to-company" placeholder="Company" />
                    </div>
                    <div>
                      <Label htmlFor="to-address1">Address Line 1</Label>
                      <Input id="to-address1" placeholder="Street address" />
                    </div>
                    <div>
                      <Label htmlFor="to-address2">Address Line 2 (optional)</Label>
                      <Input id="to-address2" placeholder="Apt, Suite, Unit, etc." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="to-city">City</Label>
                        <Input id="to-city" placeholder="City" />
                      </div>
                      <div>
                        <Label htmlFor="to-state">State</Label>
                        <Input id="to-state" placeholder="State" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="to-zip">ZIP Code</Label>
                      <Input id="to-zip" placeholder="ZIP Code" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="international" className="pt-6">
              <div className="p-4 bg-muted rounded-lg text-center">
                International shipping options will appear here
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Package Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="package-type">Package Type</Label>
                  <select 
                    id="package-type" 
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option>Custom Package</option>
                    <option>USPS Medium Flat Rate Box</option>
                    <option>USPS Small Flat Rate Box</option>
                    <option>USPS Flat Rate Envelope</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weight-lb">Weight (lb)</Label>
                    <Input id="weight-lb" type="number" min="0" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="weight-oz">oz</Label>
                    <Input id="weight-oz" type="number" min="0" max="15" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="package-value">Value ($)</Label>
                    <Input id="package-value" type="number" min="0" placeholder="0.00" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length">Length (in)</Label>
                    <Input id="length" type="number" min="0" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (in)</Label>
                    <Input id="width" type="number" min="0" placeholder="0" />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (in)</Label>
                    <Input id="height" type="number" min="0" placeholder="0" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-base">Shipping Service</Label>
                  <div className="flex flex-col space-y-2 mt-2">
                    <div className="flex items-center">
                      <input
                        id="usps"
                        name="shipping-method"
                        type="radio"
                        checked={shippingMethod === 'usps'}
                        onChange={() => setShippingMethod('usps')}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="usps" className="ml-3 block text-sm font-medium text-gray-700">
                        USPS
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="ups"
                        name="shipping-method"
                        type="radio"
                        checked={shippingMethod === 'ups'}
                        onChange={() => setShippingMethod('ups')}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="ups" className="ml-3 block text-sm font-medium text-gray-700">
                        UPS
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="fedex"
                        name="shipping-method"
                        type="radio"
                        checked={shippingMethod === 'fedex'}
                        onChange={() => setShippingMethod('fedex')}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="fedex" className="ml-3 block text-sm font-medium text-gray-700">
                        FedEx
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-base">Additional Options</Label>
                  <div className="flex flex-col space-y-2 mt-2">
                    <div className="flex items-center">
                      <input
                        id="signature"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary rounded"
                      />
                      <label htmlFor="signature" className="ml-3 block text-sm font-medium text-gray-700">
                        Signature Required
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="insurance"
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary rounded"
                      />
                      <label htmlFor="insurance" className="ml-3 block text-sm font-medium text-gray-700">
                        Add Insurance
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button size="lg" className="flex items-center gap-2">
              <span>Show Shipping Rates</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingForm;
