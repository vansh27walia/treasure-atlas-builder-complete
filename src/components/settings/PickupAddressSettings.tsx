
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { MapPin, Plus, Pencil, Trash2, Star, Check, AlertCircle } from 'lucide-react';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { SavedAddress } from '@/services/AddressService';
import AddressForm from '@/components/shipping/AddressForm';
import { AddressFormValues } from '@/components/shipping/AddressForm';
import { formatAddressForDisplay } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PickupAddressSettings: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const {
    addresses,
    selectedAddress,
    isLoading,
    isUpdating,
    addressCount,
    ADDRESS_LIMIT,
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefaultFrom,
  } = usePickupAddresses();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Refresh addresses on component mount or when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const handleAddNewClick = () => {
    if (!isAuthenticated) {
      toast.error("You need to be logged in to save addresses");
      return;
    }
    
    // Check if user has reached the address limit
    if (addressCount >= ADDRESS_LIMIT) {
      toast.error(`You've reached the limit of ${ADDRESS_LIMIT} addresses`, {
        description: "Please delete some addresses before adding new ones"
      });
      return;
    }
    
    setEditingAddress(null);
    setShowAddressModal(true);
  };

  const handleEditClick = (address: SavedAddress) => {
    setEditingAddress(address);
    setShowAddressModal(true);
  };

  const handleDeleteClick = (address: SavedAddress) => {
    setAddressToDelete(address);
    setShowDeleteConfirm(true);
  };

  const handleFormSubmit = async (values: AddressFormValues) => {
    console.log("Form submission values:", values);
    
    if (!isAuthenticated) {
      toast.error("You need to be logged in to save addresses");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure all required fields are set
      const addressData: Omit<SavedAddress, "id" | "user_id" | "created_at"> = {
        name: values.name || '',
        company: values.company || '',
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country || 'US',
        phone: values.phone || '',
        is_default_from: values.is_default_from || false,
        is_default_to: values.is_default_to || false
      };
      
      let success;
      if (editingAddress) {
        // Update existing address
        success = await updateAddress(editingAddress.id, addressData);
        if (success) {
          toast.success("Address updated successfully");
          setShowAddressModal(false);
          // Reload addresses to ensure we have the latest data
          await loadAddresses();
        }
      } else {
        // Create new address
        console.log("Creating new address with data:", addressData);
        success = await createAddress(addressData);
        if (success) {
          toast.success("New address saved successfully");
          setShowAddressModal(false);
          // Reload addresses to ensure we have the latest data
          await loadAddresses();
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (address: SavedAddress) => {
    if (!address.is_default_from) {
      const success = await setAsDefaultFrom(address.id);
      if (success) {
        await loadAddresses();
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    
    try {
      const success = await deleteAddress(addressToDelete.id);
      if (success) {
        setShowDeleteConfirm(false);
        setAddressToDelete(null);
        await loadAddresses(); // Reload to ensure we have the most up-to-date list
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address. Please try again.");
    }
  };
  
  // Calculate address limit usage
  const addressLimitUsage = Math.min(100, Math.round((addressCount / ADDRESS_LIMIT) * 100));
  
  // Combined loading state
  const showLoading = isAuthLoading || isLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pickup Addresses</h2>
        <Button 
          onClick={handleAddNewClick} 
          className="flex items-center gap-2"
          disabled={!isAuthenticated || addressCount >= ADDRESS_LIMIT || isUpdating}
        >
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>
      
      {!isAuthenticated && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-yellow-800">
              Please log in to manage your addresses.
            </p>
          </CardContent>
        </Card>
      )}
      
      {isAuthenticated && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col flex-grow mr-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Address storage</span>
              <span className="text-sm text-gray-500">{addressCount} / {ADDRESS_LIMIT}</span>
            </div>
            <Progress value={addressLimitUsage} className="h-2" />
          </div>
        </div>
      )}
      
      {addressCount >= ADDRESS_LIMIT && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-300 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've reached the limit of {ADDRESS_LIMIT} addresses. Delete some addresses before adding new ones.
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated && showLoading ? (
        <div className="py-12 flex justify-center">
          <p className="text-gray-500">Loading addresses...</p>
        </div>
      ) : isAuthenticated && addresses.length === 0 ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pickup Addresses</h3>
            <p className="text-gray-500 text-center mb-4">
              You haven't added any pickup addresses yet. Add one to make shipping easier.
            </p>
            <Button onClick={handleAddNewClick} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Address
            </Button>
          </CardContent>
        </Card>
      ) : isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={`overflow-hidden ${address.is_default_from ? 'border-2 border-green-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {address.name || 'Unnamed Address'}
                  </CardTitle>
                  {address.is_default_from && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <Check className="h-3 w-3 mr-1" /> Default
                    </span>
                  )}
                </div>
                {address.company && (
                  <CardDescription>{address.company}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <address className="not-italic">
                  <p>{address.street1}</p>
                  {address.street2 && <p>{address.street2}</p>}
                  <p>
                    {address.city}, {address.state} {address.zip}
                  </p>
                  {address.country !== 'US' && <p>{address.country}</p>}
                  {address.phone && <p className="mt-1">{address.phone}</p>}
                </address>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div>
                  {!address.is_default_from && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSetDefault(address)}
                      disabled={isUpdating}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" />
                      Set Default
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditClick(address)}
                    disabled={isUpdating}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDeleteClick(address)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          setShowAddressModal(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Pickup Address' : 'Add New Pickup Address'}</DialogTitle>
          </DialogHeader>
          <AddressForm
            defaultValues={editingAddress || { is_default_from: addresses.length === 0 }}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting || isUpdating}
            buttonText={editingAddress ? 'Update Address' : 'Save Address'}
            isPickupAddress={true}
            showDefaultOptions={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pickup Address?</DialogTitle>
          </DialogHeader>
          {addressToDelete && (
            <>
              <p className="py-2">
                Are you sure you want to delete this address? This action cannot be undone.
              </p>
              <div className="my-2 p-3 bg-gray-100 rounded">
                <p className="font-medium">{addressToDelete.name || 'Unnamed Address'}</p>
                <p className="text-sm text-gray-600">{formatAddressForDisplay(addressToDelete)}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isUpdating}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteConfirm}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Deleting...' : 'Delete Address'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PickupAddressSettings;
