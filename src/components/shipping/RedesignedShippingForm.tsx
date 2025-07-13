import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MapPin, Package, Shield, AlertTriangle, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import EnhancedWorkflowTracker from './EnhancedWorkflowTracker';
import CarrierLogo from './CarrierLogo';

const formSchema = z.object({
  pickupName: z.string().min(1, { message: "Pickup name is required." }),
  pickupCompany: z.string().optional(),
  pickupStreet: z.string().min(1, { message: "Pickup street address is required." }),
  pickupCity: z.string().min(1, { message: "Pickup city is required." }),
  pickupState: z.string().min(1, { message: "Pickup state is required." }),
  pickupZip: z.string().min(5, { message: "Pickup zip code is required." }),
  pickupCountry: z.string().min(1, { message: "Pickup country is required." }),
  pickupPhone: z.string().min(10, { message: "Pickup phone number is required." }),
  dropoffName: z.string().min(1, { message: "Drop-off name is required." }),
  dropoffCompany: z.string().optional(),
  dropoffStreet: z.string().min(1, { message: "Drop-off street address is required." }),
  dropoffCity: z.string().min(1, { message: "Drop-off city is required." }),
  dropoffState: z.string().min(1, { message: "Drop-off state is required." }),
  dropoffZip: z.string().min(5, { message: "Drop-off zip code is required." }),
  dropoffCountry: z.string().min(1, { message: "Drop-off country is required." }),
  dropoffPhone: z.string().min(10, { message: "Drop-off phone number is required." }),
  weight: z.coerce.number().min(0.1, { message: "Weight must be greater than 0." }),
  length: z.coerce.number().min(0.1, { message: "Length must be greater than 0." }),
  width: z.coerce.number().min(0.1, { message: "Width must be greater than 0." }),
  height: z.coerce.number().min(0.1, { message: "Height must be greater than 0." }),
});

type FormValues = z.infer<typeof formSchema>;

const RedesignedShippingForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(100);
  const [hasHazmat, setHasHazmat] = useState(false);
  const [weightUnit, setWeightUnit] = useState('lb');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupName: '',
      pickupCompany: '',
      pickupStreet: '',
      pickupCity: '',
      pickupState: '',
      pickupZip: '',
      pickupCountry: 'US',
      pickupPhone: '',
      dropoffName: '',
      dropoffCompany: '',
      dropoffStreet: '',
      dropoffCity: '',
      dropoffState: '',
      dropoffZip: '',
      dropoffCountry: 'US',
      dropoffPhone: '',
      weight: 1,
      length: 1,
      width: 1,
      height: 1,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Workflow Tracker */}
          <EnhancedWorkflowTracker currentStep="addresses" />

          {/* Pickup Address Section */}
          <Card className="shadow-lg border-green-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pickup Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="ZIP code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pickupPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Address Section */}
          <Card className="shadow-lg border-red-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Drop-off Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dropoffName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="ZIP code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropoffPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Package Selection Section - Always Visible */}
          <Card className="shadow-lg border-purple-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Type & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Package Type Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Select Package Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Standard Boxes */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 border-b pb-1">Standard Boxes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="small-box" className="text-blue-600" />
                        <span className="text-xl">📦</span>
                        <span className="text-sm">Small Box</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="medium-box" className="text-blue-600" />
                        <span className="text-xl">📦</span>
                        <span className="text-sm">Medium Box</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="large-box" className="text-blue-600" />
                        <span className="text-xl">📦</span>
                        <span className="text-sm">Large Box</span>
                      </div>
                    </div>
                  </div>

                  {/* Envelopes */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 border-b pb-1">Envelopes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="envelope" className="text-blue-600" />
                        <span className="text-xl">✉️</span>
                        <span className="text-sm">Standard Envelope</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="large-envelope" className="text-blue-600" />
                        <span className="text-xl">📨</span>
                        <span className="text-sm">Large Envelope</span>
                      </div>
                    </div>
                  </div>

                  {/* USPS Flat Rate */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 border-b pb-1">USPS Flat Rate</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="usps-flat-envelope" className="text-blue-600" />
                        <span className="text-xl">📮</span>
                        <span className="text-sm">Flat Rate Envelope</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="usps-small-flat-box" className="text-blue-600" />
                        <span className="text-xl">📦</span>
                        <span className="text-sm">Small Flat Rate Box</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="packageType" value="usps-medium-flat-box" className="text-blue-600" />
                        <span className="text-xl">📦</span>
                        <span className="text-sm">Medium Flat Rate Box</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carrier Selection with Logos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Select Carrier</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="carrier" value="usps" className="text-blue-600" />
                    <CarrierLogo carrier="usps" size="sm" />
                    <span className="text-sm font-medium">USPS</span>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="carrier" value="ups" className="text-blue-600" />
                    <CarrierLogo carrier="ups" size="sm" />
                    <span className="text-sm font-medium">UPS</span>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="carrier" value="fedex" className="text-blue-600" />
                    <CarrierLogo carrier="fedex" size="sm" />
                    <span className="text-sm font-medium">FedEx</span>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="carrier" value="dhl" className="text-blue-600" />
                    <CarrierLogo carrier="dhl" size="sm" />
                    <span className="text-sm font-medium">DHL</span>
                  </div>
                </div>
              </div>

              {/* Package Dimensions - Independent Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800">Package Dimensions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dimensions */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Dimensions (inches)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm text-gray-600">Length</Label>
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Width</Label>
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Height</Label>
                        <Input type="number" placeholder="0" className="mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Weight with Unit Toggle */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Weight</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={weightUnit === 'lb' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setWeightUnit('lb')}
                        >
                          Pounds
                        </Button>
                        <Button 
                          type="button" 
                          variant={weightUnit === 'kg' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setWeightUnit('kg')}
                        >
                          Kilograms
                        </Button>
                        <Button 
                          type="button" 
                          variant={weightUnit === 'oz' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setWeightUnit('oz')}
                        >
                          Ounces
                        </Button>
                      </div>
                      <Input 
                        type="number" 
                        placeholder={`Weight in ${weightUnit}`}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800">Additional Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Insurance - Auto-selected $100 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <Label className="text-base font-medium">Insurance Coverage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={true} disabled />
                      <span className="text-sm text-gray-600">Automatically included</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Coverage Amount:</span>
                      <Input 
                        type="number" 
                        value="100" 
                        className="w-24"
                        onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                      />
                      <span className="text-sm text-gray-600">USD</span>
                    </div>
                  </div>

                  {/* Hazardous Materials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <Label className="text-base font-medium">Hazardous Materials</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={hasHazmat}
                        onCheckedChange={setHasHazmat}
                      />
                      <span className="text-sm text-gray-600">Contains hazardous materials</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Label Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <Truck className="h-5 w-5 mr-2" />
              Create Shipping Label
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedesignedShippingForm;
