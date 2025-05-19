import React, { useEffect, useState } from 'react';
import { Form } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useShippingRates } from '@/hooks/useShippingRates';
import AddressSelector from './AddressSelector';
import { supabase } from '@/integrations/supabase/client';

// Add event listener for when a rate is selected from the calculator
// This will pre-fill the shipping form with the calculator data
const listenForCalculatorRate = (callback: (data: any) => void) => {
  const handler = (event: CustomEvent) => {
    if (event.detail) {
      callback(event.detail);
    }
  };
  
  document.addEventListener('calculator-rate-selected', handler as EventListener);
  return () => {
    document.removeEventListener('calculator-rate-selected', handler as EventListener);
  };
};

const EnhancedShippingForm = () => {
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [currentStep, setCurrentStep] = useState<'address' | 'package'>('address');
  const { handleSelectRate } = useShippingRates();

  // Listen for calculator rate selection
  useEffect(() => {
    const unsubscribe = listenForCalculatorRate((data) => {
      if (data && data.rateId && data.formData) {
        // Apply the selected rate
        handleSelectRate(data.rateId);
        
        // Pre-fill the form with calculator data
        const formData = data.formData;
        
        // This is where you would pre-fill the form with the calculator data
        // For example, setting country, zip code, weight, dimensions, etc.
        // This would depend on your form structure
        
        toast.success("Rate selected from calculator. Please complete your shipping details.");
      }
    });
    
    return unsubscribe;
  }, [handleSelectRate]);

  // Define the shipping form schema using Zod
  const formSchema = z.object({
    fromName: z.string().min(2, {
      message: "Sender name must be at least 2 characters.",
    }),
    fromCompany: z.string().optional(),
    fromStreet1: z.string().min(5, {
      message: "Street address is required.",
    }),
    fromStreet2: z.string().optional(),
    fromCity: z.string().min(2, {
      message: "City is required.",
    }),
    fromState: z.string().min(2, {
      message: "State is required.",
    }),
    fromZip: z.string().min(5, {
      message: "ZIP code is required.",
    }),
    fromCountry: z.string().min(2, {
      message: "Country is required.",
    }),
    fromPhone: z.string().optional(),
    toName: z.string().min(2, {
      message: "Recipient name must be at least 2 characters.",
    }),
    toCompany: z.string().optional(),
    toStreet1: z.string().min(5, {
      message: "Street address is required.",
    }),
    toStreet2: z.string().optional(),
    toCity: z.string().min(2, {
      message: "City is required.",
    }),
    toState: z.string().min(2, {
      message: "State is required.",
    }),
    toZip: z.string().min(5, {
      message: "ZIP code is required.",
    }),
    toCountry: z.string().min(2, {
      message: "Country is required.",
    }),
    toPhone: z.string().optional(),
    packageLength: z.coerce.number().min(1, {
      message: "Length is required.",
    }),
    packageWidth: z.coerce.number().min(1, {
      message: "Width is required.",
    }),
    packageHeight: z.coerce.number().min(1, {
      message: "Height is required.",
    }),
    packageWeight: z.coerce.number().min(0.1, {
      message: "Weight is required.",
    }),
  });

  // Define the form type based on the schema
  type ShippingFormValues = z.infer<typeof formSchema>;

  // Initialize the form using react-hook-form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromName: '',
      fromCompany: '',
      fromStreet1: '',
      fromStreet2: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      fromCountry: 'US',
      fromPhone: '',
      toName: '',
      toCompany: '',
      toStreet1: '',
      toStreet2: '',
      toCity: '',
      toState: '',
      toZip: '',
      toCountry: 'US',
      toPhone: '',
      packageLength: 8,
      packageWidth: 6,
      packageHeight: 4,
      packageWeight: 1,
    },
  });

  // Function to handle form submission
  const onSubmit = async (values: ShippingFormValues) => {
    setIsSending(true);
    setCurrentStep('package');

    try {
      // Construct address and parcel data
      const fromAddress = {
        name: values.fromName,
        company: values.fromCompany,
        street1: values.fromStreet1,
        street2: values.fromStreet2,
        city: values.fromCity,
        state: values.fromState,
        zip: values.fromZip,
        country: values.fromCountry,
        phone: values.fromPhone,
      };

      const toAddress = {
        name: values.toName,
        company: values.toCompany,
        street1: values.toStreet1,
        street2: values.toStreet2,
        city: values.toCity,
        state: values.toState,
        zip: values.toZip,
        country: values.toCountry,
        phone: values.toPhone,
      };

      const parcel = {
        length: values.packageLength,
        width: values.packageWidth,
        height: values.packageHeight,
        weight: values.packageWeight,
      };

      // Dispatch event for step change
      document.dispatchEvent(new CustomEvent('shipping-step-change', { detail: { step: 'package' } }));

      // Dispatch a custom event to trigger shipping rate calculation
      const event = new CustomEvent('calculate-shipping-rates', {
        detail: { fromAddress, toAddress, parcel },
      });
      document.dispatchEvent(event);

      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }

      toast.success("Shipping rates calculated successfully!");
    } catch (error) {
      console.error("Error calculating shipping rates:", error);
      toast.error("Failed to calculate shipping rates. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg rounded-xl overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Sender Information</h3>
              <AddressSelector form={form} prefix="from" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Recipient Information</h3>
              <AddressSelector form={form} prefix="to" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Package Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="packageLength" className="block text-sm font-medium text-gray-700">
                  Length (in)
                </label>
                <input
                  type="number"
                  id="packageLength"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...form.register("packageLength", { required: true })}
                />
                {form.formState.errors.packageLength && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.packageLength.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="packageWidth" className="block text-sm font-medium text-gray-700">
                  Width (in)
                </label>
                <input
                  type="number"
                  id="packageWidth"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...form.register("packageWidth", { required: true })}
                />
                {form.formState.errors.packageWidth && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.packageWidth.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="packageHeight" className="block text-sm font-medium text-gray-700">
                  Height (in)
                </label>
                <input
                  type="number"
                  id="packageHeight"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...form.register("packageHeight", { required: true })}
                />
                {form.formState.errors.packageHeight && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.packageHeight.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="packageWeight" className="block text-sm font-medium text-gray-700">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  id="packageWeight"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...form.register("packageWeight", { required: true })}
                />
                {form.formState.errors.packageWeight && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.packageWeight.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Calculating Rates...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Calculate Rates
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default EnhancedShippingForm;
