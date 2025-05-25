import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Package, Truck, Calculator, MapPin, User, Phone, Building, Calendar, Scale, Ruler, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from '../components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { supabase } from '@/integrations/supabase/client';
import FreightosCredentials from '@/components/freight/FreightosCredentials';

const unifiedFreightFormSchema = z.object({
  // Shipment type
  shipmentType: z.enum(['LTL', 'FTL']),
  
  // Pickup details
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTimeframe: z.string().default('on'),
  
  // Contact information
  contactName: z.string().min(1, "Contact name is required"),
  contactCompany: z.string().optional(),
  contactPhone: z.string().min(1, "Phone number is required"),
  
  // Shipment details
  commodityType: z.string().min(1, "Commodity type is required"),
  packagingType: z.string().min(1, "Packaging type is required"),
  weight: z.coerce.number().min(1, "Weight must be greater than 0"),
  length: z.coerce.number().min(1, "Length must be greater than 0"),
  width: z.coerce.number().min(1, "Width must be greater than 0"),
  height: z.coerce.number().min(1, "Height must be greater than 0"),
  
  // LTL specific
  freightClass: z.string().optional(),
  palletCount: z.coerce.number().optional(),
  
  // FTL specific
  trailerType: z.string().optional(),
  
  // Booleans
  stackable: z.boolean().default(false),
  isHazmat: z.boolean().default(false),
  liftgateRequired: z.boolean().default(false),
  insidePickup: z.boolean().default(false),
  insideDelivery: z.boolean().default(false),
  appointmentRequired: z.boolean().default(false),
  teamDrivers: z.boolean().default(false),
  tempControlled: z.boolean().default(false),
});

type UnifiedFreightFormValues = z.infer<typeof unifiedFreightFormSchema>;

const UnifiedFreightShippingPage: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<UnifiedFreightFormValues>({
    resolver: zodResolver(unifiedFreightFormSchema),
    defaultValues: {
      shipmentType: 'LTL',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeframe: 'on',
      contactName: '',
      contactCompany: '',
      contactPhone: '',
      commodityType: 'general',
      packagingType: 'pallets',
      weight: 0,
      length: 48,
      width: 40,
      height: 48,
      freightClass: '50',
      palletCount: 1,
      trailerType: 'dry_van',
      stackable: false,
      isHazmat: false,
      liftgateRequired: false,
      insidePickup: false,
      insideDelivery: false,
      appointmentRequired: false,
      teamDrivers: false,
      tempControlled: false,
    }
  });

  const shipmentType = form.watch('shipmentType');

  const handleGetRates = async (values: UnifiedFreightFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please select both pickup and delivery addresses");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        shipmentType: values.shipmentType,
        pickup: {
          address: fromAddress.street1,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          date: values.pickupDate,
          timeframe: values.pickupTimeframe
        },
        delivery: {
          address: toAddress.street1,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US'
        },
        contact: {
          name: values.contactName,
          company: values.contactCompany,
          phone: values.contactPhone
        },
        shipmentDetails: {
          commodityType: values.commodityType,
          packagingType: values.packagingType,
          weight: values.weight,
          dimensions: {
            length: values.length,
            width: values.width,
            height: values.height
          },
          freightClass: values.freightClass,
          palletCount: values.palletCount,
          trailerType: values.trailerType,
          stackable: values.stackable,
          isHazmat: values.isHazmat
        },
        services: {
          liftgateRequired: values.liftgateRequired,
          insidePickup: values.insidePickup,
          insideDelivery: values.insideDelivery,
          appointmentRequired: values.appointmentRequired,
          teamDrivers: values.teamDrivers,
          tempControlled: values.tempControlled
        }
      };

      console.log('Requesting unified freight rates with payload:', payload);

      const { data, error } = await supabase.functions.invoke('unified-freight-rates', {
        body: payload
      });

      if (error) {
        console.error('Error getting freight rates:', error);
        toast.error('Failed to get freight rates. Please try again.');
        return;
      }

      console.log('Received freight rates:', data);
      
      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} freight quotes!`);
      } else {
        toast.warning('No freight rates found for this route. Please try different parameters.');
        setRates([]);
      }
    } catch (error) {
      console.error('Error fetching freight rates:', error);
      toast.error('Failed to get freight rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-blue-800 flex items-center justify-center">
          <Truck className="mr-3 h-10 w-10 text-blue-600" />
          Freight Shipping
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get instant quotes for both LTL (Less Than Truckload) and FTL (Full Truckload) shipping. 
          Simply toggle between options and fill out the form to receive competitive rates.
        </p>
      </div>

      {/* API Configuration */}
      <div className="mb-6">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">API Configuration Required</span>
              </div>
              <Button 
                onClick={() => setShowCredentials(!showCredentials)}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {showCredentials ? 'Hide' : 'Configure API'}
              </Button>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Configure your Freightos API credentials to get live freight rates.
            </p>
          </div>
          {showCredentials && (
            <div className="border-t border-yellow-200 p-4">
              <FreightosCredentials />
            </div>
          )}
        </Card>
      </div>

      <Card className="border-2 border-gray-200 shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200">
            
            {/* Shipment Type Toggle */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <span className={`text-lg font-medium ${shipmentType === 'LTL' ? 'text-blue-800' : 'text-gray-500'}`}>
                    LTL (Less Than Truckload)
                  </span>
                </div>
                
                <FormField
                  control={form.control}
                  name="shipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value === 'FTL'}
                          onCheckedChange={(checked) => field.onChange(checked ? 'FTL' : 'LTL')}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center space-x-3">
                  <span className={`text-lg font-medium ${shipmentType === 'FTL' ? 'text-blue-800' : 'text-gray-500'}`}>
                    FTL (Full Truckload)
                  </span>
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  {shipmentType === 'LTL' 
                    ? 'Perfect for smaller shipments that share trailer space (150 lbs - 15,000 lbs)'
                    : 'Ideal for larger shipments requiring a dedicated trailer (15,000+ lbs)'
                  }
                </p>
              </div>
            </div>

            {/* Addresses Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Addresses
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Origin */}
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Pickup Location
                    </h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handleFromAddressSelect}
                      selectedAddressId={fromAddress?.id}
                    />
                  </div>
                  
                  {fromAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{fromAddress.name || 'Pickup Address'}</h4>
                      <p className="text-sm text-gray-600">
                        {fromAddress.street1}<br />
                        {fromAddress.street2 && <>{fromAddress.street2}<br /></>}
                        {fromAddress.city}, {fromAddress.state} {fromAddress.zip}<br />
                        {fromAddress.country}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Destination */}
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-medium text-red-700 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Delivery Location
                    </h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleToAddressSelect}
                      selectedAddressId={toAddress?.id}
                    />
                  </div>
                  
                  {toAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{toAddress.name || 'Delivery Address'}</h4>
                      <p className="text-sm text-gray-600">
                        {toAddress.street1}<br />
                        {toAddress.street2 && <>{toAddress.street2}<br /></>}
                        {toAddress.city}, {toAddress.state} {toAddress.zip}<br />
                        {toAddress.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact & Timing */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Contact Information & Timing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        Contact Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Building className="mr-1 h-4 w-4" />
                        Company (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Company Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="mr-1 h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
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
              </div>
            </div>

            {/* Shipment Details */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Shipment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="commodityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commodity Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General Merchandise</SelectItem>
                              <SelectItem value="food">Food & Beverage</SelectItem>
                              <SelectItem value="electronics">Electronics</SelectItem>
                              <SelectItem value="furniture">Furniture</SelectItem>
                              <SelectItem value="automotive">Automotive Parts</SelectItem>
                              <SelectItem value="construction">Construction Materials</SelectItem>
                              <SelectItem value="chemicals">Chemicals</SelectItem>
                              <SelectItem value="machinery">Machinery</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="packagingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Packaging Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select packaging" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pallets">Pallets</SelectItem>
                              <SelectItem value="crates">Crates</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="loose">Loose Items</SelectItem>
                              <SelectItem value="drums">Drums</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Scale className="mr-1 h-4 w-4" />
                            Weight (lbs)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Ruler className="mr-1 h-4 w-4" />
                            Length (in)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="48"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width (in)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="40"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (in)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="48"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* LTL Specific Fields */}
                  {shipmentType === 'LTL' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <FormField
                        control={form.control}
                        name="freightClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freight Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
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
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="palletCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pallet Count</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="number"
                                min="1"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* FTL Specific Fields */}
                  {shipmentType === 'FTL' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <FormField
                        control={form.control}
                        name="trailerType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trailer Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select trailer type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="dry_van">Dry Van (Standard)</SelectItem>
                                <SelectItem value="reefer">Refrigerated (Reefer)</SelectItem>
                                <SelectItem value="flatbed">Flatbed</SelectItem>
                                <SelectItem value="step_deck">Step Deck</SelectItem>
                                <SelectItem value="lowboy">Lowboy</SelectItem>
                                <SelectItem value="conestoga">Conestoga</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                
                {/* Services & Options */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <FormLabel className="text-base font-medium text-gray-700 mb-3 block">Special Services</FormLabel>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <FormField
                        control={form.control}
                        name="liftgateRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Liftgate Service</FormLabel>
                              <p className="text-xs text-gray-500">Required for locations without loading dock</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="insidePickup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Inside Pickup</FormLabel>
                              <p className="text-xs text-gray-500">Pickup from inside the building</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="insideDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Inside Delivery</FormLabel>
                              <p className="text-xs text-gray-500">Delivery inside the building</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="appointmentRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Appointment Required</FormLabel>
                              <p className="text-xs text-gray-500">Schedule delivery appointment</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {shipmentType === 'FTL' && (
                        <>
                          <FormField
                            control={form.control}
                            name="teamDrivers"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-0.5">
                                  <FormLabel>Team Drivers</FormLabel>
                                  <p className="text-xs text-gray-500">Expedited service with team drivers</p>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="tempControlled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-0.5">
                                  <FormLabel>Temperature Controlled</FormLabel>
                                  <p className="text-xs text-gray-500">Refrigerated or heated transport</p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="stackable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Stackable</FormLabel>
                              <p className="text-xs text-gray-500">Items can be stacked during transport</p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isHazmat"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Hazardous Materials</FormLabel>
                              <p className="text-xs text-gray-500">Contains hazmat goods</p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-64 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Getting Your {shipmentType} Quotes...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Calculator className="w-5 h-5 mr-3" />
                      Get {shipmentType} Freight Quotes
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Card>

      {/* Results Display */}
      {rates.length > 0 && (
        <div className="mt-8">
          <Card className="border-2 border-green-200 shadow-lg">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
              <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">
                Your {shipmentType} Freight Quotes
              </h2>
              <div className="grid gap-4">
                {rates.map((rate: any, index: number) => (
                  <div key={rate.id || index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-800">{rate.carrier}</h3>
                        <p className="text-sm text-gray-600">{rate.service}</p>
                        <p className="text-sm text-gray-500">{rate.transitTime}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${rate.rate}</div>
                        <p className="text-sm text-gray-500">{rate.currency}</p>
                      </div>
                    </div>
                    {rate.notes && (
                      <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                        {rate.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UnifiedFreightShippingPage;
