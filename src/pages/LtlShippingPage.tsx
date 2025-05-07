
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, Calculator, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from '../components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';

const ltlFormSchema = z.object({
  freightClass: z.string().min(1, "Please select a freight class"),
  palletCount: z.coerce.number().min(1, "Must have at least 1 pallet"),
  weight: z.coerce.number().min(1, "Weight must be greater than 0"),
  length: z.coerce.number().min(1, "Length must be greater than 0"),
  width: z.coerce.number().min(1, "Width must be greater than 0"),
  height: z.coerce.number().min(1, "Height must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  isHazmat: z.boolean().default(false),
  liftgatePickup: z.boolean().default(false),
  liftgateDelivery: z.boolean().default(false),
  appointmentRequired: z.boolean().default(false),
  residentialPickup: z.boolean().default(false),
  residentialDelivery: z.boolean().default(false),
});

type LtlFormValues = z.infer<typeof ltlFormSchema>;

const LtlShippingPage: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Using react-hook-form to manage form state
  const form = useForm<LtlFormValues>({
    resolver: zodResolver(ltlFormSchema),
    defaultValues: {
      freightClass: "50",
      palletCount: 1,
      weight: 0,
      length: 48,
      width: 40,
      height: 48,
      description: "",
      isHazmat: false,
      liftgatePickup: false,
      liftgateDelivery: false,
      appointmentRequired: false,
      residentialPickup: false,
      residentialDelivery: false,
    }
  });

  const handleGetRates = async (values: LtlFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please select both pickup and delivery addresses");
      return;
    }

    setIsLoading(true);
    try {
      // This would typically call an API to get LTL rates
      // For now, we'll just simulate a response
      console.log("Form values:", values);
      console.log("From address:", fromAddress);
      console.log("To address:", toAddress);
      
      toast.success("LTL quote request submitted successfully");
      
      // In a real implementation, you would process the rates
      // and display them to the user
      setTimeout(() => {
        toast.info("API integration coming soon!");
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error fetching LTL rates:', error);
      toast.error("Failed to get LTL shipping rates");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Truck className="mr-3 h-8 w-8 text-blue-600" />
        LTL (Less Than Truckload) Shipping
      </h1>
      
      <p className="mb-6 text-gray-600">
        Ship larger items that don't require a full trailer. LTL shipping is ideal for palletized freight 
        weighing between 150 lbs and 15,000 lbs.
      </p>
      
      <Card className="border-2 border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200">
            {/* Addresses Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Shipping Addresses</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origin Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Origin</h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={setFromAddress}
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
                </div>
                
                {/* Destination Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Destination</h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={setToAddress}
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
            
            {/* Freight Details Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Freight Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="freightClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freight Class</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Freight Class" />
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Weight (lbs)</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description of Goods</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Brief description of the freight" 
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
                          <FormLabel>Length (in)</FormLabel>
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
                          <FormLabel>Width (in)</FormLabel>
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
                          <FormLabel>Height (in)</FormLabel>
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
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium text-blue-700 mb-2">Special Services</FormLabel>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <FormField
                        control={form.control}
                        name="liftgatePickup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Liftgate Pickup</FormLabel>
                              <p className="text-xs text-gray-500">
                                Needed for locations without a loading dock
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="liftgateDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Liftgate Delivery</FormLabel>
                              <p className="text-xs text-gray-500">
                                Needed for locations without a loading dock
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="residentialPickup"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Residential Pickup</FormLabel>
                              <p className="text-xs text-gray-500">
                                For pickup from a residential address
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="residentialDelivery"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Residential Delivery</FormLabel>
                              <p className="text-xs text-gray-500">
                                For delivery to a residential address
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
                                Carrier will call to schedule delivery
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
                                Check if shipping hazmat goods
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-medium text-yellow-800 mb-2">LTL Shipping Notes</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-700">
                      <li>Pallets must be properly wrapped and secured</li>
                      <li>Standard pallet size is 48" x 40" x 48" or smaller</li>
                      <li>Shipments over 12 linear feet may require a volume quote</li>
                      <li>Additional fees may apply for special services</li>
                      <li>Transit times are estimates and not guaranteed</li>
                    </ul>
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
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Quotes...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Get LTL Quotes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default LtlShippingPage;
