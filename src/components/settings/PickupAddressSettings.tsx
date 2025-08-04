
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import { useAuth } from '@/contexts/AuthContext';
import InstantAddressForm from '@/components/shipping/InstantAddressForm';
import QuickAddAddressForm from './QuickAddAddressForm';

const PickupAddressSettings: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressAdded = (newAddress: SavedAddress) => {
    setAddresses(prev => [...prev, newAddress]);
    setShowAddForm(false);
    setShowQuickAdd(false);
    toast.success('Address added successfully!');
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      const success = await addressService.deleteAddress(addressId);
      if (success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        toast.success('Address deleted successfully');
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      const success = await addressService.setDefaultFromAddress(addressId);
      if (success) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_default_from: addr.id === addressId
        })));
        toast.success('Default pickup address updated');
      } else {
        throw new Error('Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const openAIChat = () => {
    // Open AI chat calculator in a new window/tab
    const aiChatUrl = '/shipping'; // Assuming this is where the AI chat is available
    window.open(aiChatUrl, '_blank', 'width=800,height=600');
    toast.success('AI Rate Calculator opened in new tab');
  };

  return (
    <div className="space-y-6">
      {/* Header with options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Pickup Address Management
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openAIChat}
                className="flex items-center"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Rate Calculator
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Quick Add Address
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <QuickAddAddressForm />
      )}

      {/* Regular Add Form */}
      {showAddForm && (
        <InstantAddressForm
          onAddressSaved={handleAddressAdded}
          isPickupAddress={true}
        />
      )}

      {/* Saved Addresses List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Pickup Addresses ({addresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pickup addresses saved yet.</p>
              <p className="text-sm">Add your first address using the buttons above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 rounded-lg border ${
                    address.is_default_from 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center">
                        {address.name || 'Unnamed Address'}
                        {address.is_default_from && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default Pickup
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.street1}
                        {address.street2 && `, ${address.street2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </p>
                      {address.company && (
                        <p className="text-sm text-gray-500">Company: {address.company}</p>
                      )}
                      {address.phone && (
                        <p className="text-sm text-gray-500">Phone: {address.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!address.is_default_from && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PickupAddressSettings;
