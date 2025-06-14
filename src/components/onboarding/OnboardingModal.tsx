import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { addressService } from '@/services/AddressService';
import { SavedAddress } from '@/types/shipping'; // Changed import
import { toast } from '@/components/ui/sonner';
import AddressFormFields from '@/components/shipping/AddressFormFields';

// ... keep existing code (schema definition)
const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  is_residential: z.boolean().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onOnboardingComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, isOpen, onClose, onOnboardingComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<Partial<SavedAddress>>({ country: 'US', is_residential: true });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultAddress,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultAddress);
    }
  }, [isOpen, reset, defaultAddress]);

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) {
      toast.error("User not found. Please log in again.");
      return;
    }
    setLoading(true);
    try {
      // Ensure all required fields for SavedAddress are present
      const addressToSave: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        name: data.name,
        company: data.company || '',
        street1: data.street1,
        street2: data.street2 || '',
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        phone: data.phone || '',
        email: data.email || '', // Ensure email is included
        is_residential: data.is_residential ?? true, // Ensure is_residential is included
        is_default_from: true, // Set as default from address
      };

      const newAddress = await addressService.addAddress(addressToSave); // Changed from createAddress
      
      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
            onboarding_completed: true,
            default_pickup_address_id: newAddress.id // Use string ID
         })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success("Onboarding complete! Your default address has been saved.");
      onOnboardingComplete();
      onClose();
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(`Onboarding failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    return (
      <div>
        <AddressFormFields control={control} errors={errors} />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Welcome! Let's get you set up.</DialogTitle>
          <DialogDescription>
            Please provide your default pickup address. This will be used for your shipments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <AddressFormFields control={control} errors={errors} />
             <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                    Skip for now
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save and Continue'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
