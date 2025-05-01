
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { MapPin, Calendar as CalendarIcon, Clock, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { carrierService, PickupRequestData } from '@/services/CarrierService';

interface PickupFormValues {
  carrier: string;
  shipmentIds: string;
  pickupDate: Date;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  name: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  packageCount: number;
  instructions: string;
}

const PickupPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    confirmation: string;
    date: string;
    carrier: string;
  } | null>(null);
  
  const form = useForm<PickupFormValues>({
    defaultValues: {
      carrier: 'usps',
      shipmentIds: '',
      pickupDate: new Date(),
      pickupTimeStart: '09:00',
      pickupTimeEnd: '17:00',
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      packageCount: 1,
      instructions: ''
    }
  });

  const handleSubmit = async (values: PickupFormValues) => {
    setIsLoading(true);
    try {
      // Prepare the pickup request data
      const pickupData: PickupRequestData = {
        carrierCode: values.carrier,
        shipmentIds: values.shipmentIds.split(',').map(id => id.trim()),
        pickupAddress: {
          name: values.name,
          company: values.company,
          street1: values.street1,
          street2: values.street2,
          city: values.city,
          state: values.state,
          zip: values.zip,
          country: values.country,
          phone: values.phone
        },
        pickupDate: format(values.pickupDate, 'yyyy-MM-dd'),
        pickupTimeWindow: {
          start: values.pickupTimeStart,
          end: values.pickupTimeEnd
        },
        instructions: values.instructions,
        packageCount: values.packageCount
      };

      // In a real implementation, we would call the carrier service
      // For demo purposes, we'll simulate a successful response
      // const result = await carrierService.schedulePickup(pickupData);
      
      // Simulate API response
      const result = {
        pickupId: 'PU_' + Math.random().toString(36).substring(2, 10),
        confirmation: 'PC' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0'),
        scheduledDate: format(values.pickupDate, 'yyyy-MM-dd'),
        carrier: values.carrier.toUpperCase()
      };

      setConfirmation({
        id: result.pickupId,
        confirmation: result.confirmation,
        date: result.scheduledDate,
        carrier: result.carrier
      });
      setPickupConfirmed(true);
      
      toast.success('Pickup scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast.error('Failed to schedule pickup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setPickupConfirmed(false);
    setConfirmation(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <MapPin className="mr-3 h-8 w-8 text-purple-600" /> 
          Schedule a Pickup
        </h1>
      </div>

      <Card className="p-6 border-2 border-gray-200 mb-8">
        {pickupConfirmed && confirmation ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 text-green-700">Pickup Scheduled!</h2>
            <p className="text-lg mb-6">Your pickup has been confirmed.</p>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-md mx-auto mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-gray-500">Confirmation #:</div>
                <div className="font-semibold">{confirmation.confirmation}</div>
                
                <div className="text-gray-500">Pickup Date:</div>
                <div className="font-semibold">{format(new Date(confirmation.date), 'MMMM d, yyyy')}</div>
                
                <div className="text-gray-500">Carrier:</div>
                <div className="font-semibold">{confirmation.carrier}</div>
                
                <div className="text-gray-500">Pickup ID:</div>
                <div className="font-semibold">{confirmation.id}</div>
              </div>
            </div>
            
            <Button onClick={resetForm} variant="outline" className="mr-2">Schedule Another Pickup</Button>
            <Button asChild>
              <a href="/dashboard?tab=tracking">View Tracking</a>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Pickup Details</h2>
                <p className="text-gray-600">Schedule a carrier pickup for your prepared shipments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="usps">USPS</SelectItem>
                            <SelectItem value="ups">UPS</SelectItem>
                            <SelectItem value="fedex">FedEx</SelectItem>
                            <SelectItem value="dhl">DHL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the carrier for your pickup
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipmentIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment ID(s)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter shipment IDs (comma-separated)" />
                        </FormControl>
                        <FormDescription>
                          Enter shipment IDs that will be picked up
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Packages</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Pickup Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => 
                                date < new Date() || 
                                date > new Date(new Date().setDate(new Date().getDate() + 14))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select a date for pickup (up to 14 days in advance)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pickupTimeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Earliest Pickup Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pickupTimeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latest Pickup Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Pickup Address</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Company Name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Apt 4B" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="State" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12345" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Any special instructions for the driver"
                          className="min-h-24"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Alert className="bg-blue-50 border border-blue-200 text-blue-800">
                <Clock className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  Pickups must be scheduled before carrier cutoff times. Same-day pickups may not be available in all areas.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="min-w-32"
                >
                  {isLoading ? 'Scheduling...' : 'Schedule Pickup'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Carrier Pickup Times</h3>
          <p className="text-gray-600 mb-2">Each carrier has different cutoff times for scheduling same-day pickups.</p>
          <ul className="text-sm space-y-1">
            <li>USPS: Before 2:00 PM local time</li>
            <li>UPS: Before 3:00 PM local time</li>
            <li>FedEx: Before 12:00 PM local time</li>
          </ul>
        </Card>
        
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Package Requirements</h3>
          <p className="text-gray-600 mb-2">All packages must be properly sealed and labeled before pickup.</p>
        </Card>
        
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-2">Contact our support team for assistance with scheduling a pickup.</p>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PickupPage;
