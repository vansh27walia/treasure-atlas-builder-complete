import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Truck, PackageCheck, MapPin, CheckCircle, AlertCircle, Package, User, Phone, Building2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AddressSelector from '@/components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

interface FormValues {
  carrierCode: string;
  pickupDate: string;
  timeStart: string;
  timeEnd: string;
  packageCount: number;
  instructions: string;
  specialInstructions: string;
  readyTime: string;
  closeTime: string;
}

interface PickupConfirmation {
  pickupId: string;
  confirmation: string;
  scheduledDate: string;
  carrier: string;
  status: string;
  address: any;
  timeWindow: {
    start: string;
    end: string;
  };
  packageCount: number;
  message: string;
  pickupFee?: number;
  estimatedWindow?: string;
}

const pickupCarriers = [
  { value: 'USPS', label: 'USPS - United States Postal Service', color: 'bg-blue-500' },
  { value: 'UPS', label: 'UPS - United Parcel Service', color: 'bg-brown-600' },
  { value: 'FedEx', label: 'FedEx Express', color: 'bg-purple-600' },
  { value: 'DHL', label: 'DHL Express', color: 'bg-red-500' },
];

const PickupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pickupConfirmation, setPickupConfirmation] = useState<PickupConfirmation | null>(null);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [availableShipments, setAvailableShipments] = useState<any[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      carrierCode: 'USPS',
      packageCount: 1,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      timeStart: '09:00',
      timeEnd: '17:00',
      readyTime: '09:00',
      closeTime: '17:00',
      instructions: '',
      specialInstructions: '',
    },
  });

  const handlePickupAddressSelect = createAddressSelectHandler(setPickupAddress);

  // Load available shipments for pickup
  useEffect(() => {
    const loadAvailableShipments = async () => {
      if (!user) return;
      
      setLoadingShipments(true);
      try {
        const { data: shipments, error } = await supabase
          .from('tracking_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'created')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailableShipments(shipments || []);
      } catch (error) {
        console.error('Error loading shipments:', error);
        toast.error('Failed to load available shipments');
      } finally {
        setLoadingShipments(false);
      }
    };

    loadAvailableShipments();
  }, [user]);

  const handleSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to schedule a pickup');
      return;
    }

    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    if (selectedShipments.length === 0) {
      toast.error('Please select at least one shipment for pickup');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Scheduling pickup with:', {
        carrierCode: values.carrierCode,
        shipmentIds: selectedShipments,
        pickupAddress,
        pickupDate: values.pickupDate
      });

      const { data, error } = await supabase.functions.invoke('schedule-pickup', {
        body: {
          carrierCode: values.carrierCode,
          shipmentIds: selectedShipments,
          pickupAddress: {
            name: pickupAddress.name || '',
            company: pickupAddress.company || '',
            street1: pickupAddress.street1,
            street2: pickupAddress.street2 || '',
            city: pickupAddress.city,
            state: pickupAddress.state,
            zip: pickupAddress.zip,
            country: pickupAddress.country || 'US',
            phone: pickupAddress.phone || '',
          },
          pickupDate: values.pickupDate,
          pickupTimeWindow: {
            start: values.timeStart,
            end: values.timeEnd,
          },
          readyTime: values.readyTime,
          closeTime: values.closeTime,
          instructions: values.instructions,
          specialInstructions: values.specialInstructions,
          packageCount: values.packageCount || selectedShipments.length,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setPickupConfirmation(data);
      toast.success('✅ Pickup scheduled successfully!');
      
      // Refresh available shipments
      const updatedShipments = availableShipments.filter(
        shipment => !selectedShipments.includes(shipment.tracking_code)
      );
      setAvailableShipments(updatedShipments);
      setSelectedShipments([]);
      
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule pickup';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipmentSelect = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
    }
    
    // Update package count automatically
    const newCount = checked ? selectedShipments.length + 1 : selectedShipments.length - 1;
    form.setValue('packageCount', Math.max(1, newCount));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center border-2 border-orange-200 bg-orange-50">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-800 mb-2">Authentication Required</h2>
          <p className="text-orange-700 mb-4">You must be logged in to schedule pickups. Please sign in to continue.</p>
          <Button onClick={() => navigate('/auth')} className="bg-orange-600 hover:bg-orange-700">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Schedule Carrier Pickup
                  </h1>
                  <p className="text-gray-600 mt-1">Book a pickup for your ready-to-ship packages</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                Live Service
              </Badge>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 p-2 bg-white shadow-sm rounded-xl border border-gray-200">
            <TabsTrigger 
              value="schedule" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule New Pickup
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Clock className="mr-2 h-5 w-5" />
              Pickup History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule">
            {!pickupConfirmation ? (
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Pickup Address Section */}
                <Card className="border-2 border-blue-200 shadow-lg bg-white rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <MapPin className="mr-3 h-6 w-6" />
                      Pickup Address
                    </h3>
                    <p className="text-blue-100 mt-1">Where should the carrier pick up your packages?</p>
                  </div>
                  <div className="p-6">
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handlePickupAddressSelect}
                      selectedAddressId={pickupAddress?.id}
                    />
                    {pickupAddress && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <span className="font-semibold text-gray-800">{pickupAddress.name}</span>
                            </div>
                            {pickupAddress.company && (
                              <div className="flex items-center space-x-2 mb-2">
                                <Building2 className="h-4 w-4 text-gray-600" />
                                <span className="text-gray-700">{pickupAddress.company}</span>
                              </div>
                            )}
                            <div className="text-gray-700">
                              <p>{pickupAddress.street1}</p>
                              {pickupAddress.street2 && <p>{pickupAddress.street2}</p>}
                              <p>{pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}</p>
                              <p>{pickupAddress.country}</p>
                            </div>
                            {pickupAddress.phone && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Phone className="h-4 w-4 text-gray-600" />
                                <span className="text-gray-700">{pickupAddress.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Available Shipments Section */}
                <Card className="border-2 border-green-200 shadow-lg bg-white rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <PackageCheck className="mr-3 h-6 w-6" />
                      Select Shipments ({selectedShipments.length} selected)
                    </h3>
                    <p className="text-green-100 mt-1">Choose which packages need to be picked up</p>
                  </div>
                  <div className="p-6">
                    {loadingShipments ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
                        <span className="text-gray-600 text-lg">Loading your shipments...</span>
                      </div>
                    ) : availableShipments.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-600 mb-2">No Shipments Available</h4>
                        <p className="text-gray-500 mb-4">Create some shipping labels first to schedule pickups.</p>
                        <Button onClick={() => navigate('/create-label')} className="bg-blue-600 hover:bg-blue-700">
                          Create Shipping Labels
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {availableShipments.map((shipment) => (
                          <div 
                            key={shipment.id} 
                            className={`flex items-start space-x-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                              selectedShipments.includes(shipment.tracking_code)
                                ? 'border-blue-300 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => handleShipmentSelect(shipment.tracking_code, !selectedShipments.includes(shipment.tracking_code))}
                          >
                            <input
                              type="checkbox"
                              checked={selectedShipments.includes(shipment.tracking_code)}
                              onChange={(e) => handleShipmentSelect(shipment.tracking_code, e.target.checked)}
                              className="h-5 w-5 text-blue-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {shipment.tracking_code}
                                </Badge>
                                <Badge className={`${
                                  shipment.carrier === 'USPS' ? 'bg-blue-100 text-blue-800' :
                                  shipment.carrier === 'UPS' ? 'bg-orange-100 text-orange-800' :
                                  shipment.carrier === 'FedEx' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {shipment.carrier} {shipment.service}
                                </Badge>
                              </div>
                              <p className="font-medium text-gray-900 truncate">{shipment.recipient_name}</p>
                              <p className="text-sm text-gray-600 truncate">{shipment.recipient_address}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Created {new Date(shipment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Pickup Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Carrier & Package Info */}
                  <Card className="border-2 border-purple-200 shadow-lg bg-white rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <Truck className="mr-3 h-6 w-6" />
                        Pickup Details
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <Label htmlFor="carrierCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Select Carrier
                        </Label>
                        <Select defaultValue="USPS" onValueChange={(value) => form.setValue('carrierCode', value)}>
                          <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl">
                            <SelectValue placeholder="Choose your preferred carrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupCarriers.map((carrier) => (
                              <SelectItem key={carrier.value} value={carrier.value}>
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${carrier.color}`}></div>
                                  <span>{carrier.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="packageCount" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Package Count
                          </Label>
                          <Input 
                            id="packageCount" 
                            type="number" 
                            min="1"
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('packageCount', { valueAsNumber: true })}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="pickupDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Pickup Date
                          </Label>
                          <Input 
                            id="pickupDate" 
                            type="date" 
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('pickupDate')} 
                            required
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Time Windows */}
                  <Card className="border-2 border-orange-200 shadow-lg bg-white rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <Clock className="mr-3 h-6 w-6" />
                        Time Windows
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="readyTime" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Ready Time
                          </Label>
                          <Input 
                            id="readyTime" 
                            type="time" 
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('readyTime')} 
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">When packages are ready</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="closeTime" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Close Time
                          </Label>
                          <Input 
                            id="closeTime" 
                            type="time" 
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('closeTime')} 
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Latest pickup time</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="timeStart" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Preferred Start
                          </Label>
                          <Input 
                            id="timeStart" 
                            type="time" 
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('timeStart')} 
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="timeEnd" className="text-sm font-semibold text-gray-700 mb-2 block">
                            Preferred End
                          </Label>
                          <Input 
                            id="timeEnd" 
                            type="time" 
                            className="h-12 border-2 border-gray-200 rounded-xl"
                            {...form.register('timeEnd')} 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Instructions */}
                <Card className="border-2 border-indigo-200 shadow-lg bg-white rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6">
                    <h3 className="text-xl font-semibold text-white">Special Instructions</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="instructions" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Pickup Instructions
                      </Label>
                      <Input 
                        id="instructions" 
                        className="h-12 border-2 border-gray-200 rounded-xl"
                        {...form.register('instructions')} 
                        placeholder="e.g., Ring doorbell, use side entrance, packages by front door"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="specialInstructions" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Special Handling
                      </Label>
                      <Input 
                        id="specialInstructions" 
                        className="h-12 border-2 border-gray-200 rounded-xl"
                        {...form.register('specialInstructions')} 
                        placeholder="e.g., Fragile items, heavy packages, special care needed"
                      />
                    </div>
                  </div>
                </Card>
                
                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    disabled={isLoading || selectedShipments.length === 0 || !pickupAddress}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin mr-3" />
                        Scheduling Pickup...
                      </>
                    ) : (
                      <>
                        <Truck className="h-6 w-6 mr-3" />
                        Schedule Pickup ({selectedShipments.length} packages)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // ... keep existing code (pickup confirmation display)
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-12 w-12 text-white mr-4" />
                    <div>
                      <h2 className="text-3xl font-bold text-white">Pickup Scheduled Successfully!</h2>
                      <p className="text-green-100 mt-1">Your pickup has been confirmed with the carrier</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Confirmation Number</h3>
                        <p className="text-2xl font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                          {pickupConfirmation.confirmation}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Carrier</h3>
                        <p className="text-xl font-semibold">{pickupConfirmation.carrier}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Pickup Date</h3>
                        <p className="text-xl">{new Date(pickupConfirmation.scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Time Window</h3>
                        <p className="text-xl">
                          {pickupConfirmation.timeWindow.start} - {pickupConfirmation.timeWindow.end}
                        </p>
                      </div>

                      {pickupConfirmation.pickupFee && (
                        <div className="bg-white p-4 rounded-xl border border-green-200">
                          <h3 className="font-semibold text-gray-700 mb-2">Pickup Fee</h3>
                          <p className="text-xl font-semibold text-green-600">${pickupConfirmation.pickupFee}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-3">Pickup Location</h3>
                        <div className="space-y-2">
                          <p className="font-medium">{pickupConfirmation.address.name}</p>
                          {pickupConfirmation.address.company && (
                            <p className="text-gray-600">{pickupConfirmation.address.company}</p>
                          )}
                          <p>{pickupConfirmation.address.street1}</p>
                          {pickupConfirmation.address.street2 && <p>{pickupConfirmation.address.street2}</p>}
                          <p>
                            {pickupConfirmation.address.city}, {pickupConfirmation.address.state} {pickupConfirmation.address.zip}
                          </p>
                          <p>{pickupConfirmation.address.country}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Package Count</h3>
                        <p className="text-xl">{pickupConfirmation.packageCount} packages</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-green-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                        <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                          {pickupConfirmation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      onClick={() => setPickupConfirmation(null)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl"
                    >
                      Schedule Another Pickup
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="manage">
            <Card className="border-2 border-gray-200 shadow-lg bg-white rounded-2xl p-8">
              <div className="text-center">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">Pickup History</h2>
                <p className="text-gray-500 mb-6">
                  Pickup history feature coming soon. You'll be able to view and manage all your scheduled pickups here.
                </p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Coming Soon
                </Badge>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PickupPage;
