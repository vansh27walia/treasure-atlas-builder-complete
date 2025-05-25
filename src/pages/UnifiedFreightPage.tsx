
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Package, Truck, Calculator, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from '../components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { supabase } from '@/integrations/supabase/client';

// Define schema that adapts based on shipping type
const createFreightSchema = (isLTL: boolean) => z.object({
  // Contact Information
  contactName: z.string().min(1, "Contact name is required"),
  companyName: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  
  // Pickup Details
  pickupDate: z.string().min(1, "Pickup date is required"),
  timeframeType: z.string().default("on"),
  
  // Shipment Details
  commodityType: z.string().min(1, "Commodity type is required"),
  packagingType: z.string().min(1, "Packaging type is required"),
  weight: z.coerce.number().min(1, "Weight must be greater than 0"),
  length: z.coerce.number().min(1, "Length must be greater than 0"),
  width: z.coerce.number().min(1, "Width must be greater than 0"),
  height: z.coerce.number().min(1, "Height must be greater than 0"),
  
  // LTL specific fields
  ...(isLTL && {
    freightClass: z.string().min(1, "Freight class is required for LTL"),
    palletCount: z.coerce.number().min(1, "Pallet count is required for LTL")
  }),
  
  // FTL specific fields
  ...(!isLTL && {
    trailerType: z.string().min(1, "Trailer type is required for FTL")
  }),
  
  // Boolean fields
  stackable: z.boolean().default(false),
  isHazmat: z.boolean().default(false),
  liftgateRequired: z.boolean().default(false),
  insidePickup: z.boolean().default(false),
  insideDelivery: z.boolean().default(false),
  appointmentRequired: z.boolean().default(false),
  
  // FTL specific services
  ...(!isLTL && {
    teamDrivers: z.boolean().default(false),
    tempControlled: z.boolean().default(false)
  })
});

interface FreightRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  transitTime: string;
  notes?: string;
}

const UnifiedFreightPage: React.FC = () => {
  const [isLTL, setIsLTL] = useState(true);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<FreightRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<FreightRate | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm({
    resolver: zodResolver(createFreightSchema(isLTL)),
    defaultValues: {
      contactName: "",
      companyName: "",
      phoneNumber: "",
      pickupDate: new Date().toISOString().split('T')[0],
      timeframeType: "on",
      commodityType: "general",
      packagingType: isLTL ? "pallets" : "loose",
      weight: 0,
      length: isLTL ? 48 : 48,
      width: isLTL ? 40 : 48,
      height: isLTL ? 48 : 108,
      freightClass: isLTL ? "50" : undefined,
      palletCount: isLTL ? 1 : undefined,
      trailerType: !isLTL ? "dry_van" : undefined,
      stackable: false,
      isHazmat: false,
      liftgateRequired: false,
      insidePickup: false,
      insideDelivery: false,
      appointmentRequired: false,
      teamDrivers: false,
      tempControlled: false
    }
  });

  const handleShippingTypeToggle = (checked: boolean) => {
    setIsLTL(!checked); // Switch is FTL when checked
    setRates([]);
    setSelectedRate(null);
    setShowConfirmation(false);
    form.reset();
  };

  const handleGetRates = async (values: any) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please select both pickup and delivery addresses");
      return;
    }

    setIsLoading(true);
    try {
      const shipmentData = {
        shipmentType: isLTL ? 'LTL' : 'FTL',
        pickup: {
          address: fromAddress.street1,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country,
          date: values.pickupDate,
          timeframeType: values.timeframeType
        },
        delivery: {
          address: toAddress.street1,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country
        },
        contact: {
          name: values.contactName,
          company: values.companyName,
          phone: values.phoneNumber
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
          ...(isLTL && {
            freightClass: values.freightClass,
            palletCount: values.palletCount
          }),
          ...(!isLTL && {
            trailerType: values.trailerType
          }),
          stackable: values.stackable,
          isHazmat: values.isHazmat
        },
        services: {
          liftgateRequired: values.liftgateRequired,
          insidePickup: values.insidePickup,
          insideDelivery: values.insideDelivery,
          appointmentRequired: values.appointmentRequired,
          ...(!isLTL && {
            teamDrivers: values.teamDrivers,
            tempControlled: values.tempControlled
          })
        }
      };

      console.log('Requesting freight rates:', shipmentData);

      const { data, error } = await supabase.functions.invoke('unified-freight-rates', {
        body: shipmentData
      });

      if (error) {
        console.error('Error getting freight rates:', error);
        toast.error('Failed to get freight rates. Please try again.');
        return;
      }

      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} freight quotes!`);
      } else {
        toast.warning('No freight rates found for this route.');
        setRates([]);
      }
    } catch (error) {
      console.error('Error fetching freight rates:', error);
      toast.error('Failed to get freight rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelection = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowConfirmation(true);
    toast.success(`Selected ${rate.carrier} - ${rate.service}`);
  };

  const handleConfirmShipment = () => {
    if (!selectedRate) return;
    
    toast.success('Shipment confirmed! You will receive tracking information shortly.');
    console.log('Confirmed shipment with rate:', selectedRate);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-800 flex items-center">
          <Truck className="mr-3 h-8 w-8 text-blue-600" />
          Freight Shipping
        </h1>
        
        {/* Shipping Type Toggle */}
        <div className="flex items-center space-x-3">
          <Label htmlFor="shipping-type" className="text-sm font-medium">
            LTL
          </Label>
          <Switch
            id="shipping-type"
            checked={!isLTL}
            onCheckedChange={handleShippingTypeToggle}
          />
          <Label htmlFor="shipping-type" className="text-sm font-medium">
            FTL
          </Label>
        </div>
      </div>
      
      <p className="mb-6 text-gray-600">
        {isLTL 
          ? "Ship palletized freight weighing between 150 lbs and 15,000 lbs with LTL (Less Than Truckload) shipping."
          : "For larger shipments requiring a dedicated trailer. FTL shipping provides faster transit times and increased security."
        }
      </p>
      
      <Card className="border-2 border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200">
            {/* Contact Information */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Company name (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Addresses Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Shipping Addresses</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origin Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Pickup Location</h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handleFromAddressSelect}
                      selectedAddressId={fromAddress?.id}
                    />
                  </div>
                  
                  {fromAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{fromAddress.name || 'Unnamed'}</h4>
                      <p className="text-sm text-gray-600">
                        {fromAddress.street1}<br />
                        {fromAddress.street2 && <>{fromAddress.street2}<br /></>}
                        {fromAddress.city}, {fromAddress.state} {fromAddress.zip}<br />
                        {fromAddress.country}
                      </p>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="pickupDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Date *</FormLabel>
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
                
                {/* Destination Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Delivery Location</h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleToAddressSelect}
                      selectedAddressId={toAddress?.id}
                    />
                  </div>
                  
                  {toAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{toAddress.name || 'Unnamed'}</h4>
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
            
            {/* Shipment Details Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Shipment Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="commodityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commodity Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormLabel>Packaging Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select packaging" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLTL ? (
                                <>
                                  <SelectItem value="pallets">Pallets</SelectItem>
                                  <SelectItem value="crates">Crates</SelectItem>
                                  <SelectItem value="boxes">Boxes</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="loose">Loose Cargo</SelectItem>
                                  <SelectItem value="pallets">Palletized</SelectItem>
                                  <SelectItem value="containers">Containers</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* LTL Specific Fields */}
                  {isLTL && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="freightClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freight Class *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                <SelectItem value="125">Class 125</SelectItem>
                                <SelectItem value="150">Class 150</SelectItem>
                                <SelectItem value="200">Class 200</SelectItem>
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
                            <FormLabel>Pallet Count *</FormLabel>
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
                  {!isLTL && (
                    <FormField
                      control={form.control}
                      name="trailerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trailer Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  )}
                  
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Weight (lbs) *</FormLabel>
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
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length (in) *</FormLabel>
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
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width (in) *</FormLabel>
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
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (in) *</FormLabel>
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
                  </div>
                </div>
                
                {/* Services and Options */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium text-blue-700 mb-4 block">Additional Services</FormLabel>
                    
                    <div className="space-y-3">
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
                              <FormLabel>Liftgate Required</FormLabel>
                              <p className="text-xs text-gray-500">
                                For locations without a loading dock
                              </p>
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
                              <p className="text-xs text-gray-500">
                                Pickup from inside the building
                              </p>
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
                              <p className="text-xs text-gray-500">
                                Delivery inside the building
                              </p>
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
                              <p className="text-xs text-gray-500">
                                Carrier will call to schedule
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {!isLTL && (
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
                                  <p className="text-xs text-gray-500">
                                    For expedited delivery
                                  </p>
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
                                  <p className="text-xs text-gray-500">
                                    For temperature-sensitive goods
                                  </p>
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
                              <p className="text-xs text-gray-500">
                                Can be stacked during transit
                              </p>
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
                              <p className="text-xs text-gray-500">
                                Contains hazmat goods
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button Section */}
            <div className="p-6 bg-gray-50">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting Quotes...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Get {isLTL ? 'LTL' : 'FTL'} Quotes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Card>

      {/* Rates Display */}
      {rates.length > 0 && (
        <Card className="mt-8 border-2 border-green-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-green-700">Available Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRate?.id === rate.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRateSelection(rate)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{rate.carrier}</h3>
                    <span className="text-lg font-bold text-blue-600">
                      {rate.currency} {rate.rate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{rate.service}</p>
                  <p className="text-sm text-gray-500">{rate.transitTime}</p>
                  {rate.notes && (
                    <p className="text-xs text-gray-400 mt-2">{rate.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation Section */}
      {showConfirmation && selectedRate && (
        <Card className="mt-8 border-2 border-yellow-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-yellow-700">Confirm Your Shipment</h2>
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Selected Rate:</h3>
              <p className="text-yellow-700">
                {selectedRate.carrier} - {selectedRate.service} | {selectedRate.currency} {selectedRate.rate} | {selectedRate.transitTime}
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
              >
                Back to Rates
              </Button>
              <Button
                onClick={handleConfirmShipment}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Shipment
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UnifiedFreightPage;
