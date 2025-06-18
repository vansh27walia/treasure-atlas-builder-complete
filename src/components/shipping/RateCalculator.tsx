
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useShippingRates } from '@/hooks/useShippingRates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  fromName: z.string().optional(),
  fromCompany: z.string().optional(),
  fromStreet1: z.string().min(2, {
    message: "From street address must be at least 2 characters.",
  }),
  fromStreet2: z.string().optional(),
  fromCity: z.string().min(2, {
    message: "From city must be at least 2 characters.",
  }),
  fromState: z.string().min(2, {
    message: "From state must be at least 2 characters.",
  }),
  fromZip: z.string().min(5, {
    message: "From zip code must be at least 5 characters.",
  }),
  fromCountry: z.string().optional(),
  fromPhone: z.string().optional(),
  toName: z.string().optional(),
  toCompany: z.string().optional(),
  toStreet1: z.string().min(2, {
    message: "To street address must be at least 2 characters.",
  }),
  toStreet2: z.string().optional(),
  toCity: z.string().min(2, {
    message: "To city must be at least 2 characters.",
  }),
  toState: z.string().min(2, {
    message: "To state must be at least 2 characters.",
  }),
  toZip: z.string().min(5, {
    message: "To zip code must be at least 5 characters.",
  }),
  toCountry: z.string().optional(),
  toPhone: z.string().optional(),
  length: z.string().refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Length must be a number greater than 0.",
  }),
  width: z.string().refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Width must be a number greater than 0.",
  }),
  height: z.string().refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Height must be a number greater than 0.",
  }),
  weight: z.string().refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Weight must be a number greater than 0.",
  }),
});

type FormData = z.infer<typeof formSchema>;

const RateCalculator: React.FC = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromName: "",
      fromCompany: "",
      fromStreet1: "",
      fromStreet2: "",
      fromCity: "",
      fromState: "",
      fromZip: "",
      fromCountry: "US",
      fromPhone: "",
      toName: "",
      toCompany: "",
      toStreet1: "",
      toStreet2: "",
      toCity: "",
      toState: "",
      toZip: "",
      toCountry: "US",
      toPhone: "",
      length: "",
      width: "",
      height: "",
      weight: "",
    },
  });
  
  const { rates, isLoading: ratesLoading, fetchRates, clearRates } = useShippingRates();

  const onSubmit = async (data: FormData) => {
    console.log('Rate calculator form submitted:', data);

    try {
      await fetchRates({
        fromAddress: {
          name: data.fromName || 'Sender',
          street1: data.fromStreet1,
          street2: data.fromStreet2 || '',
          city: data.fromCity,
          state: data.fromState,
          zip: data.fromZip,
          country: data.fromCountry || 'US',
          phone: data.fromPhone || '',
          company: data.fromCompany || ''
        },
        toAddress: {
          name: data.toName || 'Recipient',
          street1: data.toStreet1,
          street2: data.toStreet2 || '',
          city: data.toCity,
          state: data.toState,
          zip: data.toZip,
          country: data.toCountry || 'US',
          phone: data.toPhone || '',
          company: data.toCompany || ''
        },
        parcel: {
          length: parseFloat(data.length) || 1,
          width: parseFloat(data.width) || 1,
          height: parseFloat(data.height) || 1,
          weight: parseFloat(data.weight) || 1
        }
      });
    } catch (error) {
      console.error('Rate calculation error:', error);
      toast.error('Failed to calculate rates');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">From Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="fromName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromStreet1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromStreet2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromZip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="555-123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">To Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="toName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Beta Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toStreet1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address 1</FormLabel>
                  <FormControl>
                    <Input placeholder="456 Elm St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toStreet2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 2A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Los Angeles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toZip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="90001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="toCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="555-987-6543" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Package Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (in)</FormLabel>
                  <FormControl>
                    <Input placeholder="12" {...field} />
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
                    <Input placeholder="8" {...field} />
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
                    <Input placeholder="4" {...field} />
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
                  <FormLabel>Weight (lb)</FormLabel>
                  <FormControl>
                    <Input placeholder="2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={ratesLoading}>
          Calculate Rates
        </Button>

        {/* Add rates display section */}
        {rates.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Available Shipping Rates</h3>
            <div className="space-y-3">
              {rates.map((rate) => (
                <div key={rate.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{rate.carrier} - {rate.service}</p>
                      <p className="text-sm text-gray-600">
                        Delivery: {rate.delivery_days} days
                        {rate.delivery_date && ` (${new Date(rate.delivery_date).toLocaleDateString()})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${parseFloat(rate.rate).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{rate.currency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

export default RateCalculator;
