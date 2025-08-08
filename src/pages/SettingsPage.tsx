
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import QuickAddressModal from '@/components/settings/QuickAddressModal';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import GoogleApiKeyInput from '@/components/settings/GoogleApiKeyInput';

const SettingsPage = () => {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setSavedAddresses(addresses);
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load saved addresses');
      } finally {
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, []);

  const handleAddressSaved = (newAddress: SavedAddress) => {
    setSavedAddresses(prev => [...prev, newAddress]);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const success = await addressService.deleteAddress(id);
      if (success) {
        setSavedAddresses(prev => prev.filter(addr => addr.id !== id));
        toast.success('Address deleted');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your shipping preferences and saved addresses</p>
          </div>
        </div>

        {/* Google API Configuration */}
        <GoogleApiKeyInput />

        {/* Pickup Address Settings */}
        <PickupAddressSettings />

        {/* Quick Save Addresses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Quick Save Addresses
            </CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Save Address
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading addresses...</div>
            ) : savedAddresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved addresses yet.</p>
                <p className="text-sm">Click "Quick Save Address" to add your first address.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedAddresses.map((address) => (
                  <div key={address.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {address.label && (
                          <span className="text-blue-600 font-semibold">{address.label} - </span>
                        )}
                        {address.firstName && address.lastName 
                          ? `${address.firstName} ${address.lastName}` 
                          : address.name
                        }
                      </div>
                      {address.company && (
                        <div className="text-sm text-gray-600">{address.company}</div>
                      )}
                      <div className="text-sm text-gray-600">
                        {address.street1}
                        {address.street2 && `, ${address.street2}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </div>
                      {address.phone && (
                        <div className="text-sm text-gray-600">{address.phone}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Address Modal */}
      <QuickAddressModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddressSaved={handleAddressSaved}
      />
    </div>
  );
};

export default SettingsPage;
