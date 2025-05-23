import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { addressService } from '@/services/AddressService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleAddressFormProps {
  onSuccess?: () => void;
}

const SimpleAddressForm: React.FC<SimpleAddressFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    is_default_from: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_default_from: checked }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to save addresses");
      return;
    }
    
    // Validate required fields
    if (!formData.street1) {
      toast.error("Street address is required");
      return;
    }
    if (!formData.city) {
      toast.error("City is required");
      return;
    }
    if (!formData.state) {
      toast.error("State is required");
      return;
    }
    if (!formData.zip) {
      toast.error("ZIP code is required");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, ensure user exists in users table
      const { data: userData } = await addressService.getSession();
      if (!userData?.session?.user) {
        throw new Error("User session not found");
      }
      
      // Create the address directly
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('id', userData.session.user.id)
        .maybeSingle();
        
      if (!data) {
        // Insert user if not exists
        await supabase
          .from('users')
          .insert({
            id: userData.session.user.id,
            email: userData.session.user.email
          });
      }
      
      // Now create the address
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert({
          ...formData,
          user_id: userData.session.user.id
        })
        .select();
        
      if (addressError) {
        throw new Error(addressError.message);
      }
      
      toast.success("Address saved successfully!");
      
      // Reset form
      setFormData({
        name: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        is_default_from: true
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Quick Address Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Full name" 
              />
            </div>
            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input 
                id="company" 
                name="company" 
                value={formData.company} 
                onChange={handleChange} 
                placeholder="Company name" 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="street1">Address Line 1</Label>
            <Input 
              id="street1" 
              name="street1" 
              value={formData.street1} 
              onChange={handleChange} 
              placeholder="Street address" 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="street2">Address Line 2 (Optional)</Label>
            <Input 
              id="street2" 
              name="street2" 
              value={formData.street2} 
              onChange={handleChange} 
              placeholder="Apartment, suite, etc." 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                placeholder="City" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                name="state" 
                value={formData.state} 
                onChange={handleChange} 
                placeholder="State" 
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input 
                id="zip" 
                name="zip" 
                value={formData.zip} 
                onChange={handleChange} 
                placeholder="ZIP code" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                name="country" 
                value={formData.country} 
                onChange={handleChange} 
                placeholder="Country" 
                required 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input 
              id="phone" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="Phone number" 
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is_default_from" 
              checked={formData.is_default_from} 
              onCheckedChange={handleCheckboxChange} 
            />
            <label 
              htmlFor="is_default_from" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set as default pickup address
            </label>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Address'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleAddressForm;
