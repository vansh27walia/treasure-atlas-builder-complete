import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send, Clock, Package, MapPin, ArrowRight, Ruler } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from '../components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const instantDeliverySchema = z.object({
  packageSize: z.string().min(1, "Select a package size"),
  packageType: z.string().min(1, "Select package type"),
  weight: z.coerce.number().min(0, "Weight must be greater than or equal to 0").max(50, "Weight must be less than 50 lbs"),
  // Add dimensions fields
  length: z.coerce.number().min(0, "Length must be greater than or equal to 0"),
  width: z.coerce.number().min(0, "Width must be greater than or equal to 0"),
  height: z.coerce.number().min(0, "Height must be greater than or equal to 0"),
  description: z.string().min(1, "Description is required"),
  deliverySpeed: z.enum(["asap", "scheduled"]),
  scheduledTime: z.string().optional(),
  scheduledDate: z.string().optional(),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientPhone: z.string().min(10, "Valid phone number is required"),
  instructions: z.string().optional(),
  contactless: z.boolean().default(false),
  requireSignature: z.boolean().default(false),
  fragile: z.boolean().default(false),
}).refine((data) => {
  // If delivery is scheduled, both date and time are required
  if (data.deliverySpeed === 'scheduled') {
    return !!data.scheduledDate && !!data.scheduledTime;
  }
  return true;
}, {
  message: "Scheduled date and time are required for scheduled deliveries",
  path: ['scheduledTime'],
});

type InstantDeliveryFormValues = z.infer<typeof instantDeliverySchema>;

const InstantDeliveryPage: React.FC = () => {
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create address selection handlers using the updated utility function
  const handlePickupAddressSelect = createAddressSelectHandler(setPickupAddress);
  const handleDropoffAddressSelect = createAddressSelectHandler(setDropoffAddress);

  // Using react-hook-form to manage form state
  const form = useForm<InstantDeliveryFormValues>({
    resolver: zodResolver(instantDeliverySchema),
    defaultValues: {
      packageSize: "small",
      packageType: "box",
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      description: "",
      deliverySpeed: "asap",
      recipientName: "",
      recipientPhone: "",
      instructions: "",
      contactless: false,
      requireSignature: false,
      fragile: false,
    }
  });

  // Watch delivery speed to conditionally show scheduled time fields
  const deliverySpeed = form.watch("deliverySpeed");

  const handleGetRates = async (values: InstantDeliveryFormValues) => {
    if (!pickupAddress || !dropoffAddress) {
      toast.error("Please select both pickup and dropoff addresses");
      return;
    }

    setIsLoading(true);
    try {
      // This would typically call an API to get delivery quote
      console.log("Form values:", values);
      console.log("Pickup address:", pickupAddress);
      console.log("Dropoff address:", dropoffAddress);
      
      toast.success("Instant delivery quote request submitted");
      
      setTimeout(() => {
        toast.info("API integration coming soon!");
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error fetching delivery quote:', error);
      toast.error("Failed to get instant delivery quote");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Send className="mr-3 h-8 w-8 text-blue-600" />
        Instant Delivery
      </h1>
      
      <p className="mb-6 text-gray-600">
        Same-day courier service for your time-sensitive packages. Get your items delivered across town in just hours.
      </p>
      
      <Card className="border-2 border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200">
            {/* Addresses Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Pickup & Dropoff Addresses</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Pickup Location</h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handlePickupAddressSelect}
                      selectedAddressId={pickupAddress?.id}
                    />
                  </div>
                  
                  {pickupAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{pickupAddress.name || 'Unnamed'}</h4>
                      <p className="text-sm text-gray-600">
                        {pickupAddress.street1}<br />
                        {pickupAddress.street2 && <>{pickupAddress.street2}<br /></>}
                        {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}<br />
                        {pickupAddress.country}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Dropoff Address Section */}
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Dropoff Location</h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleDropoffAddressSelect}
                      selectedAddressId={dropoffAddress?.id}
                    />
                  </div>
                  
                  {dropoffAddress && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{dropoffAddress.name || 'Unnamed'}</h4>
                      <p className="text-sm text-gray-600">
                        {dropoffAddress.street1}<br />
                        {dropoffAddress.street2 && <>{dropoffAddress.street2}<br /></>}
                        {dropoffAddress.city}, {dropoffAddress.state} {dropoffAddress.zip}<br />
                        {dropoffAddress.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Package Details Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Package Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="packageSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Size</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Package Size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small (fits in a shoebox)</SelectItem>
                            <SelectItem value="medium">Medium (fits in a backpack)</SelectItem>
                            <SelectItem value="large">Large (fits in a car trunk)</SelectItem>
                            <SelectItem value="x-large">X-Large (requires van or SUV)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Package Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="envelope">Envelope</SelectItem>
                            <SelectItem value="bag">Bag</SelectItem>
                            <SelectItem value="food">Food/Beverage</SelectItem>
                            <SelectItem value="flowers">Flowers</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              max="50"
                              step="0.1"
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
                      name="fragile"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-6">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div>
                            <FormLabel>Fragile</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Package Dimensions Section */}
                  <div className="space-y-3">
                    <div className="flex items-center mb-2">
                      <Ruler className="mr-2 h-4 w-4 text-blue-600" />
                      <h3 className="text-md font-medium">Dimensions (inches)</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                step="0.1"
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
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                step="0.1"
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
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                step="0.1"
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
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Description</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Brief description of what you're sending" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="deliverySpeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Timing</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            value={field.value} 
                            onValueChange={field.onChange}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="asap" />
                              </FormControl>
                              <FormLabel className="flex items-center font-normal">
                                <Clock className="mr-2 h-4 w-4" /> ASAP (within hours)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="scheduled" />
                              </FormControl>
                              <FormLabel className="font-normal">Schedule for later</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {deliverySpeed === "scheduled" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="scheduledDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
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
                        name="scheduledTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Who will receive the package" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="Contact number for delivery" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Special instructions for the courier" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="contactless"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel>Contactless Delivery</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="requireSignature"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel>Require Signature</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
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
                      Getting Quote...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Get Instant Quote
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

export default InstantDeliveryPage;
