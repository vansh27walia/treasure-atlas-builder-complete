import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, Clock, Truck, PackageCheck, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
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
  { value: 'USPS', label: 'USPS - United States Postal Service' },
  { value: 'UPS', label: 'UPS - United Parcel Service' },
  { value: 'FedEx', label: 'FedEx' },
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
      pickupDate: new Date().toISOString().split('T')[0],
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
      console.log('Scheduling pickup with values:', values);
      console.log('Pickup address:', pickupAddress);
      console.log('Selected shipments:', selectedShipments);

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
      toast.success('Pickup scheduled successfully!');
      
      // Refresh available shipments
      const updatedShipments = availableShipments.filter(
        shipment => !selectedShipments.includes(shipment.tracking_code)
      );
      setAvailableShipments(updatedShipments);
      setSelectedShipments([]);
      
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule pickup');
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to schedule pickups. Please sign in to continue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
        <h1 className="text-3xl font-bold text-purple-800 flex items-center">
          <Truck className="mr-3 h-8 w-8 text-purple-600" /> 
          Schedule Carrier Pickup
        </h1>
      </div>
      
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 p-2 bg-purple-50">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule New Pickup
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
            <Clock className="mr-2 h-5 w-5" />
            Pickup History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          {!pickupConfirmation ? (
            <Card className="border-2 border-gray-200 shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <PackageCheck className="mr-2 h-6 w-6 text-purple-600" />
                Schedule Carrier Pickup
              </h2>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Pickup Address Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center text-blue-700">
                    <MapPin className="mr-2 h-5 w-5" />
                    Pickup Address
                  </h3>
                  <AddressSelector 
                    type="from"
                    onAddressSelect={handlePickupAddressSelect}
                    selectedAddressId={pickupAddress?.id}
                  />
                  {pickupAddress && (
                    <div className="mt-4 p-3 bg-white border border-blue-200 rounded">
                      <p className="font-medium">{pickupAddress.name}</p>
                      <p className="text-sm text-gray-600">
                        {pickupAddress.street1}
                        {pickupAddress.street2 && `, ${pickupAddress.street2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Available Shipments Section */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 flex items-center text-green-700">
                    <PackageCheck className="mr-2 h-5 w-5" />
                    Select Shipments for Pickup ({selectedShipments.length} selected)
                  </h3>
                  
                  {loadingShipments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading available shipments...</span>
                    </div>
                  ) : availableShipments.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No shipments available for pickup. Create some shipping labels first.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableShipments.map((shipment) => (
                        <div key={shipment.id} className="flex items-center space-x-3 p-3 bg-white border rounded">
                          <input
                            type="checkbox"
                            id={shipment.tracking_code}
                            checked={selectedShipments.includes(shipment.tracking_code)}
                            onChange={(e) => handleShipmentSelect(shipment.tracking_code, e.target.checked)}
                            className="h-4 w-4 text-purple-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{shipment.tracking_code}</p>
                            <p className="text-sm text-gray-600">
                              {shipment.recipient_name} - {shipment.carrier} {shipment.service}
                            </p>
                            <p className="text-xs text-gray-500">{shipment.recipient_address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pickup Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Truck className="mr-2 h-5 w-5 text-purple-500" />
                      Pickup Details
                    </h3>
                    
                    <div>
                      <Label htmlFor="carrierCode">Carrier</Label>
                      <Select defaultValue="USPS" onValueChange={(value) => form.setValue('carrierCode', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupCarriers.map((carrier) => (
                            <SelectItem key={carrier.value} value={carrier.value}>
                              {carrier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="packageCount">Package Count</Label>
                        <Input 
                          id="packageCount" 
                          type="number" 
                          min="1"
                          {...form.register('packageCount', { valueAsNumber: true })}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="pickupDate">Pickup Date</Label>
                        <Input 
                          id="pickupDate" 
                          type="date" 
                          {...form.register('pickupDate')} 
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Windows */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-purple-500" />
                      Time Windows
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="readyTime">Ready Time</Label>
                        <Input 
                          id="readyTime" 
                          type="time" 
                          {...form.register('readyTime')} 
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">When packages are ready</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="closeTime">Close Time</Label>
                        <Input 
                          id="closeTime" 
                          type="time" 
                          {...form.register('closeTime')} 
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Latest pickup time</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeStart">Preferred Start</Label>
                        <Input 
                          id="timeStart" 
                          type="time" 
                          {...form.register('timeStart')} 
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeEnd">Preferred End</Label>
                        <Input 
                          id="timeEnd" 
                          type="time" 
                          {...form.register('timeEnd')} 
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instructions">Pickup Instructions</Label>
                    <Input 
                      id="instructions" 
                      {...form.register('instructions')} 
                      placeholder="Ring doorbell, use side entrance, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions</Label>
                    <Input 
                      id="specialInstructions" 
                      {...form.register('specialInstructions')} 
                      placeholder="Fragile items, special handling, etc."
                    />
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-white px-8"
                    disabled={isLoading || selectedShipments.length === 0 || !pickupAddress}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scheduling Pickup...
                      </>
                    ) : (
                      <>
                        <Truck className="h-5 w-5" />
                        Schedule Pickup ({selectedShipments.length} packages)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            
            <Card className="border-2 border-green-200 bg-green-50 shadow-sm p-6 mb-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 mr-4" />
                <h2 className="text-2xl font-bold text-green-800">Pickup Scheduled Successfully!</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Confirmation Number</h3>
                    <p className="text-xl font-mono bg-white border border-green-200 rounded p-2 mt-1">
                      {pickupConfirmation.confirmation}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Carrier</h3>
                    <p className="text-lg">{pickupConfirmation.carrier}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Date</h3>
                    <p className="text-lg">{new Date(pickupConfirmation.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Time</h3>
                    <p className="text-lg">
                      {pickupConfirmation.timeWindow.start} - {pickupConfirmation.timeWindow.end}
                    </p>
                  </div>

                  {pickupConfirmation.pickupFee && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Pickup Fee</h3>
                      <p className="text-lg">${pickupConfirmation.pickupFee}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Location</h3>
                    <div className="bg-white border border-green-200 rounded p-3 mt-1">
                      <p>{pickupConfirmation.address.name}</p>
                      <p>{pickupConfirmation.address.street1}</p>
                      {pickupConfirmation.address.street2 && <p>{pickupConfirmation.address.street2}</p>}
                      <p>
                        {pickupConfirmation.address.city}, {pickupConfirmation.address.state} {pickupConfirmation.address.zip}
                      </p>
                      <p>{pickupConfirmation.address.country}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Package Count</h3>
                    <p className="text-lg">{pickupConfirmation.packageCount}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700">Status</h3>
                    <p className="text-lg capitalize">{pickupConfirmation.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => setPickupConfirmation(null)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Schedule Another Pickup
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="manage">
          <Card className="border-2 border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Clock className="mr-2 h-6 w-6 text-purple-600" />
              Pickup History
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">Pickup history feature coming soon. You'll be able to view and manage all your scheduled pickups here.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PickupPage;
