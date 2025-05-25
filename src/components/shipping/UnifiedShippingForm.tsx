
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, MapPin, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Schema for form validation
const baseSchema = z.object({
  shipment_type: z.enum(['LTL', 'FTL']),
  origin: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().default('US')
  }),
  destination: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
    country: z.string().default('US')
  }),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  delivery_date: z.string().optional()
});

const ltlSchema = baseSchema.extend({
  packages: z.array(z.object({
    length: z.coerce.number().min(1, 'Length must be greater than 0'),
    width: z.coerce.number().min(1, 'Width must be greater than 0'),
    height: z.coerce.number().min(1, 'Height must be greater than 0'),
    weight: z.coerce.number().min(1, 'Weight must be greater than 0'),
    freight_class: z.string().min(1, 'Freight class is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1')
  })).min(1, 'At least one package is required')
});

const ftlSchema = baseSchema.extend({
  truck_type: z.string().min(1, 'Truck type is required'),
  load_weight: z.coerce.number().min(1, 'Load weight must be greater than 0'),
  load_type: z.string().min(1, 'Load type is required'),
  special_requirements: z.string().optional()
});

type UnifiedFormData = z.infer<typeof baseSchema> & {
  packages?: z.infer<typeof ltlSchema>['packages'];
  truck_type?: string;
  load_weight?: number;
  load_type?: string;
  special_requirements?: string;
};

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days: string | number;
  delivery_date?: string;
  rate_id?: string;
}

interface UnifiedShippingFormProps {
  onRatesReceived: (rates: ShippingRate[], shipmentType: string) => void;
}

const UnifiedShippingForm: React.FC<UnifiedShippingFormProps> = ({ onRatesReceived }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shipmentType, setShipmentType] = useState<'LTL' | 'FTL'>('LTL');

  const form = useForm<UnifiedFormData>({
    resolver: zodResolver(shipmentType === 'LTL' ? ltlSchema : ftlSchema),
    defaultValues: {
      shipment_type: 'LTL',
      origin: { country: 'US' },
      destination: { country: 'US' },
      pickup_date: new Date().toISOString().split('T')[0],
      packages: [{ 
        length: 48, 
        width: 40, 
        height: 48, 
        weight: 500, 
        freight_class: '70', 
        quantity: 1 
      }],
      truck_type: 'dry_van',
      load_weight: 26000,
      load_type: 'palletized'
    }
  });

  const handleShipmentTypeChange = (type: 'LTL' | 'FTL') => {
    setShipmentType(type);
    form.setValue('shipment_type', type);
  };

  const onSubmit = async (data: UnifiedFormData) => {
    setIsLoading(true);
    try {
      console.log('Submitting form data:', data);

      const { data: result, error } = await supabase.functions.invoke('get-uship-rates', {
        body: { shipmentData: data }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Failed to get shipping rates: ' + error.message);
        return;
      }

      if (result.error) {
        console.error('uShip API error:', result.error);
        toast.error('Failed to get rates: ' + result.error);
        return;
      }

      console.log('Received rates:', result.rates);
      
      if (result.rates && result.rates.length > 0) {
        onRatesReceived(result.rates, data.shipment_type);
        toast.success(`Found ${result.rates.length} shipping rates`);
      } else {
        toast.info('No rates available for this shipment');
      }

    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Truck className="mr-2 h-6 w-6 text-blue-600" />
          Get Shipping Quotes
        </h2>
        <p className="text-gray-600">
          Compare LTL and FTL shipping rates from multiple carriers
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Shipment Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={shipmentType === 'LTL' ? 'default' : 'outline'}
              onClick={() => handleShipmentTypeChange('LTL')}
              className="p-4 h-auto flex flex-col items-center"
            >
              <Package className="h-6 w-6 mb-2" />
              <span className="font-medium">LTL Shipping</span>
              <span className="text-xs">Less than Truckload</span>
            </Button>
            <Button
              type="button"
              variant={shipmentType === 'FTL' ? 'default' : 'outline'}
              onClick={() => handleShipmentTypeChange('FTL')}
              className="p-4 h-auto flex flex-col items-center"
            >
              <Truck className="h-6 w-6 mb-2" />
              <span className="font-medium">FTL Shipping</span>
              <span className="text-xs">Full Truckload</span>
            </Button>
          </div>

          {/* Addresses Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-green-600" />
                Origin Address
              </h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="origin.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="origin.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="origin.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ZIP Code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Destination Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-red-600" />
                Destination Address
              </h3>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="destination.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Street address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="destination.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="destination.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ZIP Code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pickup_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Pickup Date
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delivery_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Delivery Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Conditional Fields Based on Shipment Type */}
          {shipmentType === 'LTL' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Package Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="packages.0.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (inches)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packages.0.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (inches)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packages.0.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (inches)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="packages.0.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packages.0.freight_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freight Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select freight class" />
                          </SelectTrigger>
                        </FormControl>
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
                          <SelectItem value="110">Class 110</SelectItem>
                          <SelectItem value="125">Class 125</SelectItem>
                          <SelectItem value="150">Class 150</SelectItem>
                          <SelectItem value="175">Class 175</SelectItem>
                          <SelectItem value="200">Class 200</SelectItem>
                          <SelectItem value="250">Class 250</SelectItem>
                          <SelectItem value="300">Class 300</SelectItem>
                          <SelectItem value="400">Class 400</SelectItem>
                          <SelectItem value="500">Class 500</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packages.0.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {shipmentType === 'FTL' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Load Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="truck_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Truck Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select truck type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dry_van">Dry Van</SelectItem>
                          <SelectItem value="flatbed">Flatbed</SelectItem>
                          <SelectItem value="reefer">Refrigerated (Reefer)</SelectItem>
                          <SelectItem value="step_deck">Step Deck</SelectItem>
                          <SelectItem value="lowboy">Lowboy</SelectItem>
                          <SelectItem value="conestoga">Conestoga</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="load_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Load Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" max="80000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="load_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Load Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select load type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="palletized">Palletized</SelectItem>
                          <SelectItem value="loose">Loose Cargo</SelectItem>
                          <SelectItem value="boxed">Boxed</SelectItem>
                          <SelectItem value="machinery">Machinery</SelectItem>
                          <SelectItem value="automotive">Automotive</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="special_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Any special handling requirements" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isLoading}
              className="min-w-[200px]"
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
      </Form>
    </Card>
  );
};

export default UnifiedShippingForm;
