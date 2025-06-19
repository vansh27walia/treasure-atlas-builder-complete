
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Truck } from 'lucide-react';
import { useShippingRates } from '@/hooks/useShippingRates';
import PickupAddressSelector from './PickupAddressSelector';
import AddressForm from './AddressForm';

interface ShippingFormData {
  fromAddress: any;
  toAddress: any;
  parcel: {
    length: number;
    width: number;
    height: number;
    weight: number;
    weightUnit: string;
  };
}

const ShippingForm = () => {
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [toAddress, setToAddress] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const { fetchRates, clearRates, isLoading } = useShippingRates();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ShippingFormData>({
    defaultValues: {
      parcel: {
        length: 10,
        width: 10,
        height: 10,
        weight: 10,
        weightUnit: 'oz'
      }
    }
  });

  const weightUnit = watch('parcel.weightUnit');

  useEffect(() => {
    // Clear rates when component mounts or form is reset
    clearRates();
  }, [clearRates]);

  // Handle address form submission for destination address
  const handleToAddressSubmit = (addressData: any) => {
    console.log('To address submitted:', addressData);
    setToAddress(addressData);
  };

  const onSubmit = async (data: ShippingFormData) => {
    if (!fromAddress || !toAddress) {
      console.error('Missing addresses');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting || hasSubmitted) {
      console.log('Form already submitted or submitting, skipping');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting shipping form with data:', data);

      const rateRequest = {
        fromAddress,
        toAddress,
        parcel: {
          ...data.parcel,
          weightUnit: data.parcel.weightUnit
        }
      };

      console.log('Fetching rates with request:', rateRequest);
      await fetchRates(rateRequest);
      
      setHasSubmitted(true);
      
      // Dispatch form completion event
      const event = new CustomEvent('shipping-form-completed', {
        detail: rateRequest
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setHasSubmitted(false);
    setFromAddress(null);
    setToAddress(null);
    clearRates();
  };

  // Mock function for adding new address - you might want to implement this properly
  const handleAddNewAddress = () => {
    console.log('Add new address clicked');
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* From Address Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">From Address</h3>
          </div>
          <PickupAddressSelector
            onAddressSelected={setFromAddress}
            selectedAddress={fromAddress}
            onAddNew={handleAddNewAddress}
          />
        </div>

        <Separator />

        {/* To Address Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">To Address</h3>
          </div>
          <AddressForm
            onSubmit={handleToAddressSubmit}
            defaultValues={toAddress}
            buttonText="Save Destination Address"
            showDefaultOptions={false}
            isPickupAddress={false}
          />
        </div>

        <Separator />

        {/* Package Details Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Package Details</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="length">Length (in)</Label>
              <Input
                id="length"
                type="number"
                {...register('parcel.length', { required: true, min: 1 })}
              />
              {errors.parcel?.length && (
                <span className="text-red-500 text-sm">Length is required</span>
              )}
            </div>
            
            <div>
              <Label htmlFor="width">Width (in)</Label>
              <Input
                id="width"
                type="number"
                {...register('parcel.width', { required: true, min: 1 })}
              />
              {errors.parcel?.width && (
                <span className="text-red-500 text-sm">Width is required</span>
              )}
            </div>
            
            <div>
              <Label htmlFor="height">Height (in)</Label>
              <Input
                id="height"
                type="number"
                {...register('parcel.height', { required: true, min: 1 })}
              />
              {errors.parcel?.height && (
                <span className="text-red-500 text-sm">Height is required</span>
              )}
            </div>
            
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...register('parcel.weight', { required: true, min: 0.1 })}
              />
              {errors.parcel?.weight && (
                <span className="text-red-500 text-sm">Weight is required</span>
              )}
            </div>
          </div>

          <div className="w-full md:w-48">
            <Label htmlFor="weightUnit">Weight Unit</Label>
            <Select
              value={weightUnit}
              onValueChange={(value) => setValue('parcel.weightUnit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oz">Ounces (oz)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={!fromAddress || !toAddress || isSubmitting || isLoading || hasSubmitted}
            className="flex-1"
          >
            {isSubmitting || isLoading ? 'Getting Rates...' : hasSubmitted ? 'Rates Loaded' : 'Get Shipping Rates'}
          </Button>
          
          {hasSubmitted && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset Form
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default ShippingForm;
