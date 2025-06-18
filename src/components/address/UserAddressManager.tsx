
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

interface Address {
  id?: number;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  is_default_from?: boolean;
  is_default_to?: boolean;
}

interface UserAddressManagerProps {
  onSelectAddress?: (address: Address, type: 'from' | 'to') => void;
  type?: 'from' | 'to';
}

const UserAddressManager: React.FC<UserAddressManagerProps> = ({ onSelectAddress, type = 'from' }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Address>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    is_default_from: false,
    is_default_to: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const addressData = {
        ...formData,
        user_id: user.id
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Address updated successfully');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert([addressData]);

        if (error) throw error;
        toast.success('Address saved successfully');
      }

      setShowForm(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: number, defaultType: 'from' | 'to') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, unset all defaults of this type
      await supabase
        .from('addresses')
        .update({ [`is_default_${defaultType}`]: false })
        .eq('user_id', user.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ [`is_default_${defaultType}`]: true })
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(`Default ${defaultType} address updated`);
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
    }
  };

  const resetForm = () => {
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
      is_default_from: false,
      is_default_to: false
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowForm(true);
  };

  const handleSelectForShipping = (address: Address) => {
    if (onSelectAddress) {
      onSelectAddress(address, type);
      toast.success(`${type === 'from' ? 'Origin' : 'Destination'} address selected`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          Saved Addresses
        </h3>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street1">Street Address *</Label>
                  <Input
                    id="street1"
                    value={formData.street1}
                    onChange={(e) => setFormData({...formData, street1: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street2">Street Address 2</Label>
                  <Input
                    id="street2"
                    value={formData.street2}
                    onChange={(e) => setFormData({...formData, street2: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {editingAddress ? 'Update' : 'Save'} Address
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {addresses.map((address) => (
          <Card key={address.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{address.name}</h4>
                  {address.is_default_from && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Default From
                    </span>
                  )}
                  {address.is_default_to && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Default To
                    </span>
                  )}
                </div>
                {address.company && <p className="text-sm text-gray-600">{address.company}</p>}
                <p className="text-sm">{address.street1}</p>
                {address.street2 && <p className="text-sm">{address.street2}</p>}
                <p className="text-sm">{address.city}, {address.state} {address.zip}</p>
                {address.phone && <p className="text-sm">Phone: {address.phone}</p>}
              </div>
              <div className="flex gap-2">
                {onSelectAddress && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectForShipping(address)}
                  >
                    Select
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(address)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => address.id && handleDelete(address.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => address.id && handleSetDefault(address.id, 'from')}
                className="text-xs"
              >
                Set as Default From
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => address.id && handleSetDefault(address.id, 'to')}
                className="text-xs"
              >
                Set as Default To
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {addresses.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No saved addresses yet. Add your first address to get started.</p>
        </div>
      )}
    </div>
  );
};

export default UserAddressManager;
