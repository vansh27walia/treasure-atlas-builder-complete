
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { HomeAddress, PaymentInfo, userProfileService, UserProfile } from '@/services/UserProfileService';
import { MapPin, Plus, Edit, Trash2, Check, CreditCard, Home, UserCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface AddressFormValues {
  name: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default_from: boolean;
}

interface HomeAddressFormValues {
  name: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface PaymentInfoFormValues {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

const SettingsPage: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('locations');
  const navigate = useNavigate();
  
  // Setup form for pickup addresses
  const addressForm = useForm<AddressFormValues>({
    defaultValues: {
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
    }
  });
  
  // Setup form for home address
  const homeAddressForm = useForm<HomeAddressFormValues>({
    defaultValues: {
      name: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
    }
  });
  
  // Setup form for payment info
  const paymentForm = useForm<PaymentInfoFormValues>({
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
    }
  });
  
  // Load saved addresses and user profile data
  const loadAddresses = async () => {
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };
  
  const loadUserProfile = async () => {
    try {
      const profile = await userProfileService.getUserProfile();
      setUserProfile(profile);
      
      // If user has a home address, populate the form
      if (profile?.home_address) {
        homeAddressForm.reset({
          name: profile.home_address.name || '',
          street1: profile.home_address.street1,
          street2: profile.home_address.street2 || '',
          city: profile.home_address.city,
          state: profile.home_address.state,
          zip: profile.home_address.zip,
          country: profile.home_address.country || 'US',
          phone: profile.home_address.phone || '',
        });
      }
      
      // If user has payment info, populate the form (partially, for security)
      if (profile?.payment_info) {
        paymentForm.reset({
          cardholderName: profile.payment_info.cardholder_name,
          cardNumber: '', // Don't populate for security reasons
          expiryMonth: profile.payment_info.exp_month,
          expiryYear: profile.payment_info.exp_year,
          cvv: '',
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    }
  };
  
  useEffect(() => {
    loadAddresses();
    loadUserProfile();
  }, []);
  
  // Reset form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      addressForm.reset({
        name: editingAddress.name || '',
        company: editingAddress.company || '',
        street1: editingAddress.street1,
        street2: editingAddress.street2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        zip: editingAddress.zip,
        country: editingAddress.country || 'US',
        phone: editingAddress.phone || '',
        is_default_from: editingAddress.is_default_from,
      });
    } else {
      addressForm.reset({
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
      });
    }
  }, [editingAddress, addressForm]);
  
  // Handle pickup address form submission
  const handleAddressSubmit = async (values: AddressFormValues) => {
    setIsLoading(true);
    
    try {
      // Create a new address object
      const addressData = {
        ...values,
        is_default_to: false, // We're only managing pickup (from) addresses in this page
      };
      
      if (editingAddress) {
        // Update existing address
        const updated = await addressService.updateAddress(editingAddress.id, addressData);
        
        if (updated) {
          if (values.is_default_from) {
            await addressService.setDefaultFromAddress(editingAddress.id);
          }
          
          // Update default pickup address in user profile if this is the default from address
          if (values.is_default_from) {
            await userProfileService.updateDefaultPickupAddressId(editingAddress.id);
          }
          
          toast.success('Pickup location updated successfully');
          loadAddresses(); // Refresh the address list
          setEditingAddress(null); // Reset editing state
        }
      } else {
        // Create new address
        const newAddress = await addressService.createAddress(addressData);
        
        if (newAddress) {
          if (values.is_default_from) {
            await addressService.setDefaultFromAddress(newAddress.id);
            
            // Update default pickup address in user profile
            await userProfileService.updateDefaultPickupAddressId(newAddress.id);
          }
          
          toast.success('Pickup location added successfully');
          loadAddresses(); // Refresh the address list
          addressForm.reset(); // Clear the form
        }
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save pickup location');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle home address form submission
  const handleHomeAddressSubmit = async (values: HomeAddressFormValues) => {
    setIsLoading(true);
    
    try {
      const homeAddress: HomeAddress = {
        name: values.name || undefined,
        street1: values.street1,
        street2: values.street2 || undefined,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone || undefined,
      };
      
      const success = await userProfileService.updateHomeAddress(homeAddress);
      
      if (success) {
        toast.success('Home address updated successfully');
        loadUserProfile(); // Refresh user profile data
      } else {
        throw new Error('Failed to update home address');
      }
    } catch (error) {
      console.error('Error saving home address:', error);
      toast.error('Failed to save home address');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle payment form submission
  const handlePaymentSubmit = async (values: PaymentInfoFormValues) => {
    setIsLoading(true);
    
    try {
      // Only update if card number is provided (otherwise user might just be updating name)
      if (values.cardNumber && values.cardNumber.length >= 13) {
        const paymentInfo: PaymentInfo = {
          card_number: values.cardNumber.replace(/\s/g, ''),
          exp_month: values.expiryMonth,
          exp_year: values.expiryYear,
          cardholder_name: values.cardholderName,
          last4: values.cardNumber.slice(-4),
        };
        
        const success = await userProfileService.updatePaymentInfo(paymentInfo);
        
        if (success) {
          toast.success('Payment information updated successfully');
          loadUserProfile(); // Refresh user profile data
          
          // Reset sensitive fields
          paymentForm.setValue('cardNumber', '');
          paymentForm.setValue('cvv', '');
        } else {
          throw new Error('Failed to update payment information');
        }
      } else if (!values.cardNumber && userProfile?.payment_info) {
        // Just updating cardholder name or expiry
        const paymentInfo: PaymentInfo = {
          card_number: `XXXX-XXXX-XXXX-${userProfile.payment_info.last4}`,
          exp_month: values.expiryMonth,
          exp_year: values.expiryYear,
          cardholder_name: values.cardholderName,
          last4: userProfile.payment_info.last4,
        };
        
        const success = await userProfileService.updatePaymentInfo(paymentInfo);
        
        if (success) {
          toast.success('Payment information updated successfully');
          loadUserProfile(); // Refresh user profile data
        } else {
          throw new Error('Failed to update payment information');
        }
      } else {
        toast.error('Please enter a valid card number');
        return;
      }
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast.error('Failed to save payment information');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (addressId: number) => {
    if (confirm('Are you sure you want to delete this pickup location?')) {
      try {
        const success = await addressService.deleteAddress(addressId);
        
        if (success) {
          toast.success('Pickup location deleted successfully');
          
          // If this was the default pickup address in user profile, remove it
          if (userProfile?.default_pickup_address_id === addressId) {
            await userProfileService.updateDefaultPickupAddressId(0); // 0 means no default
          }
          
          loadAddresses(); // Refresh the address list
          
          // If we're editing the address that was deleted, reset the form
          if (editingAddress && editingAddress.id === addressId) {
            setEditingAddress(null);
          }
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete pickup location');
      }
    }
  };
  
  const handleSetDefault = async (addressId: number) => {
    try {
      // Update both the address record and the user profile
      const success = await addressService.setDefaultFromAddress(addressId);
      
      if (success) {
        // Update user profile with the new default address
        await userProfileService.updateDefaultPickupAddressId(addressId);
        
        toast.success('Default pickup location updated');
        loadAddresses(); // Refresh the address list
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default pickup location');
    }
  };
  
  // Render masked card number for display
  const renderMaskedCardNumber = () => {
    if (!userProfile?.payment_info) return 'No card saved';
    return `•••• •••• •••• ${userProfile.payment_info.last4}`;
  };
  
  // Determine card brand from number
  const getCardBrand = (cardNumber: string): string => {
    // Simple card brand detection
    if (cardNumber.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cardNumber)) return 'Mastercard';
    if (/^3[47]/.test(cardNumber)) return 'American Express';
    if (/^6(?:011|5)/.test(cardNumber)) return 'Discover';
    return 'Card';
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Locations
              </TabsTrigger>
              <TabsTrigger value="home" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home Address
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="account" disabled className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>
            
            {/* Pickup Locations Tab */}
            <TabsContent value="locations">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Manage Pickup Locations</CardTitle>
                  <CardDescription>
                    Add, edit, or delete your saved pickup locations for faster shipment creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-md">
                        <MapPin className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No saved pickup locations</h3>
                        <p className="text-gray-500 mt-1 mb-4">Add your first pickup location below</p>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <Card key={address.id} className={`border ${
                          (address.is_default_from || userProfile?.default_pickup_address_id === address.id) 
                            ? 'border-green-500' 
                            : 'border-gray-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{address.name || 'Unnamed Location'}</h3>
                                  {(address.is_default_from || userProfile?.default_pickup_address_id === address.id) && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                {address.company && <p className="text-gray-600">{address.company}</p>}
                                <p>{address.street1}</p>
                                {address.street2 && <p>{address.street2}</p>}
                                <p>
                                  {address.city}, {address.state} {address.zip}
                                </p>
                                <p>{address.country}</p>
                                {address.phone && <p className="text-gray-600">{address.phone}</p>}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingAddress(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(address.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {(!address.is_default_from || userProfile?.default_pickup_address_id !== address.id) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSetDefault(address.id)}
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                    title="Set as default"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{editingAddress ? 'Edit Pickup Location' : 'Add New Pickup Location'}</CardTitle>
                  <CardDescription>
                    {editingAddress 
                      ? 'Update your pickup location details' 
                      : 'Enter the details for a new pickup location'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={addressForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Home, Office, etc." {...field} />
                              </FormControl>
                              <FormDescription>
                                A name to help you identify this location
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressForm.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Company name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={addressForm.control}
                        name="street1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" required {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="street2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="ZIP code" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addressForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Country" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={addressForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addressForm.control}
                        name="is_default_from"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Default Settings</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                  id="is_default_from"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_default_from" className="text-sm text-gray-700">
                                  Set as default pickup location
                                </label>
                              </div>
                            </FormControl>
                            <FormDescription>
                              This address will be automatically selected when creating new shipments
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        {editingAddress ? (
                          <>
                            <Button type="button" variant="outline" onClick={() => setEditingAddress(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Saving...' : 'Update Location'}
                            </Button>
                          </>
                        ) : (
                          <Button type="submit" className="ml-auto" disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Location'}
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Home Address Tab */}
            <TabsContent value="home">
              <Card>
                <CardHeader>
                  <CardTitle>Home Address</CardTitle>
                  <CardDescription>
                    Update your home address information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...homeAddressForm}>
                    <form onSubmit={homeAddressForm.handleSubmit(handleHomeAddressSubmit)} className="space-y-6">
                      <FormField
                        control={homeAddressForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={homeAddressForm.control}
                        name="street1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" required {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={homeAddressForm.control}
                        name="street2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartment, suite, unit, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={homeAddressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={homeAddressForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={homeAddressForm.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="ZIP code" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={homeAddressForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Country" required {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={homeAddressForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Home Address'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payment Tab */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Update your payment details for shipping services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile?.payment_info && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium mb-2">Current Payment Method</h3>
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-10 w-10 text-blue-500" />
                        <div>
                          <p className="font-medium">
                            {userProfile.payment_info.brand || getCardBrand(userProfile.payment_info.card_number)} ending in {userProfile.payment_info.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {userProfile.payment_info.exp_month}/{userProfile.payment_info.exp_year}
                          </p>
                          <p className="text-sm text-gray-500">
                            {userProfile.payment_info.cardholder_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
                      <FormField
                        control={paymentForm.control}
                        name="cardholderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cardholder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name on card" required {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number {userProfile?.payment_info ? '(leave blank to keep current)' : ''}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={userProfile?.payment_info ? renderMaskedCardNumber() : "XXXX XXXX XXXX XXXX"} 
                                {...field} 
                                maxLength={19}
                                required={!userProfile?.payment_info}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={paymentForm.control}
                          name="expiryMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Month</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="MM" 
                                  required 
                                  maxLength={2}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentForm.control}
                          name="expiryYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Year</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="YY" 
                                  required 
                                  maxLength={2}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentForm.control}
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV {userProfile?.payment_info ? '(only for new card)' : ''}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="XXX" 
                                  required={!userProfile?.payment_info || !!paymentForm.watch('cardNumber')}
                                  maxLength={4}
                                  type="password"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-md mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> For demonstration purposes only. In a production environment, we would use a secure payment processor like Stripe to handle payment information.
                        </p>
                      </div>
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Payment Information'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="w-full md:w-1/3 md:sticky md:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Why save pickup locations?</h3>
                <p className="text-sm text-gray-600">
                  Saved locations make it faster to create shipping labels and schedule pickups.
                  Your default location will be automatically selected when creating shipments.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Home address vs. pickup locations</h3>
                <p className="text-sm text-gray-600">
                  Your home address is used for billing and account purposes, while pickup locations are used for shipment origins.
                  You can have multiple pickup locations but only one home address.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Payment information</h3>
                <p className="text-sm text-gray-600">
                  Your payment information is securely stored and used for shipping transactions.
                  You can update your payment details at any time.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Address validation</h3>
                <p className="text-sm text-gray-600">
                  For the best shipping rates and delivery times, ensure your addresses are complete
                  and formatted correctly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
