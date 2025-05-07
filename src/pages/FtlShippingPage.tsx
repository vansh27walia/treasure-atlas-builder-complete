
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

const ftlFormSchema = z.object({
  trailerType: z.string().min(1, "Please select a trailer type"),
  weight: z.coerce.number().min(1, "Weight must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  isHazmat: z.boolean().default(false),
  teamDrivers: z.boolean().default(false),
  tempControlled: z.boolean().default(false),
  loadingDate: z.string().min(1, "Loading date is required"),
  commodityType: z.string().min(1, "Commodity type is required"),
});

type FtlFormValues = z.infer<typeof ftlFormSchema>;

const FtlShippingPage: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Using react-hook-form to manage form state
  const form = useForm<FtlFormValues>({
    resolver: zodResolver(ftlFormSchema),
    defaultValues: {
      trailerType: "dry_van",
      weight: 0,
      description: "",
      isHazmat: false,
      teamDrivers: false,
      tempControlled: false,
      loadingDate: new Date().toISOString().split('T')[0],
      commodityType: "general",
    }
  });

  const handleGetRates = async (values: FtlFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please select both pickup and delivery addresses");
      return;
    }

    setIsLoading(true);
    try {
      // This would typically call an API to get FTL rates
      // For now, we'll just simulate a response
      console.log("Form values:", values);
      console.log("From address:", fromAddress);
      console.log("To address:", toAddress);
      
      toast.success("FTL quote request submitted successfully");
      
      setTimeout(() => {
        toast.info("API integration coming soon!");
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error fetching FTL rates:', error);
      toast.error("Failed to get FTL shipping rates");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Truck className="mr-3 h-8 w-8 text-blue-600" />
        Full Truckload (FTL) Shipping
      </h1>
      
      <p className="mb-6 text-gray-600">
        For larger shipments that require a dedicated trailer. FTL shipping provides faster transit times, 
        minimal handling, and increased security for your freight.
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
                    name="trailerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trailer Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Trailer Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dry_van">Dry Van (Standard)</SelectItem>
                            <SelectItem value="reefer">Refrigerated (Reefer)</SelectItem>
                            <SelectItem value="flatbed">Flatbed</SelectItem>
                            <SelectItem value="step_deck">Step Deck</SelectItem>
                            <SelectItem value="lowboy">Lowboy</SelectItem>
                            <SelectItem value="conestoga">Conestoga</SelectItem>
                            <SelectItem value="power_only">Power Only</SelectItem>
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
                    
                    <FormField
                      control={form.control}
                      name="loadingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loading Date</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="commodityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Commodity Type" />
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
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium text-blue-700 mb-2">Special Requirements</FormLabel>
                    
                    <div className="grid grid-cols-1 gap-3 mt-3">
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
                                Required for perishable or temperature-sensitive goods
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
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
                                For expedited delivery (additional cost)
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
                                Check if shipping hazmat goods (requires special handling)
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-medium text-yellow-800 mb-2">FTL Shipping Notes</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-700">
                      <li>Standard 53' trailer capacity: up to 45,000 lbs</li>
                      <li>Loading/unloading typically allowed for 2 hours at origin and destination</li>
                      <li>Detention fees may apply after free time is used</li>
                      <li>Team drivers can provide continuous transit for time-critical shipments</li>
                      <li>You must have proper equipment for loading/unloading at both locations</li>
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
                      Get FTL Quotes
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

export default FtlShippingPage;
