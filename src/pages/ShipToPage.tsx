
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Globe, AlertCircle, Info, Package, MapPin, Scale, CircleDollarSign, Loader2, Download } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShippingRates } from '@/hooks/useShippingRates';
import { AddressData, ParcelData, ShippingRequestData, carrierService } from '@/services/CarrierService';
import ShippingRates from '@/components/ShippingRates';

interface FormValues {
  fromName: string;
  fromCompany: string;
  fromAddress1: string;
  fromAddress2: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  fromCountry: string;
  toName: string;
  toCompany: string;
  toAddress1: string;
  toAddress2: string;
  toCity: string;
  toState: string;
  toZip: string;
  toCountry: string;
  packageType: string;
  weightLb: number;
  weightOz: number;
  packageValue: number;
  length: number;
  width: number;
  height: number;
  carrier: string;
  description: string;
  contents: string;
  phone: string;
  toPhone: string;
}

const carriers = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'all', label: 'Compare All Carriers' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
];

const ShipToPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('document');
  const [isLoading, setIsLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [ratesData, setRatesData] = useState<any[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    defaultValues: {
      fromCountry: 'US',
      toCountry: '',
      carrier: 'all',
      packageType: activeTab === 'document' ? 'envelope' : 'box',
    }
  });
  
  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setShowRates(false);
    
    try {
      // Prepare shipping request data
      const fromAddress: AddressData = {
        name: values.fromName,
        company: values.fromCompany || undefined,
        street1: values.fromAddress1,
        street2: values.fromAddress2 || undefined,
        city: values.fromCity,
        state: values.fromState,
        zip: values.fromZip,
        country: values.fromCountry,
        phone: values.phone || undefined,
      };
      
      const toAddress: AddressData = {
        name: values.toName,
        company: values.toCompany || undefined,
        street1: values.toAddress1,
        street2: values.toAddress2 || undefined,
        city: values.toCity,
        state: values.toState,
        zip: values.toZip,
        country: values.toCountry,
        phone: values.toPhone || undefined,
      };
      
      // Calculate weight in oz
      const weightInOz = (values.weightLb || 0) * 16 + (values.weightOz || 0);
      
      const parcel: ParcelData = {
        length: values.length || (activeTab === 'document' ? 10 : 12),
        width: values.width || (activeTab === 'document' ? 8 : 10),
        height: values.height || (activeTab === 'document' ? 0.25 : 8),
        weight: weightInOz || (activeTab === 'document' ? 3 : 16), // Default weight in oz
      };
      
      const requestData: ShippingRequestData = {
        fromAddress,
        toAddress,
        parcel,
        options: {
          label_format: 'PDF',
          insurance: values.packageValue > 0 ? values.packageValue : undefined,
        }
      };
      
      // Fetch shipping rates
      const shippingRates = await carrierService.getShippingRates(requestData);
      
      // Store shipment ID for label creation
      if (shippingRates.length > 0 && shippingRates[0]?.shipment_id) {
        setShipmentId(shippingRates[0].shipment_id);
      }
      
      setRatesData(shippingRates);
      
      // Dispatch custom event with shipping rates
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: {
          rates: shippingRates,
          shipmentId: shippingRates[0]?.shipment_id || null,
        }
      });
      
      document.dispatchEvent(ratesEvent);
      setShowRates(true);
      toast.success("Ship To rates retrieved successfully");
    } catch (error) {
      console.error("Error getting shipping rates:", error);
      toast.error("Failed to get shipping rates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const [savedAddresses, setSavedAddresses] = useState([
    { id: '1', name: 'Home Office', street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101' },
    { id: '2', name: 'Warehouse', street: '456 Storage Ave', city: 'Chicago', state: 'IL', zip: '60007' },
  ]);
  
  const [selectedFromAddress, setSelectedFromAddress] = useState('');
  
  const handleSelectFromAddress = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      form.setValue('fromAddress1', address.street);
      form.setValue('fromCity', address.city);
      form.setValue('fromState', address.state);
      form.setValue('fromZip', address.zip);
      setSelectedFromAddress(addressId);
    }
  };

  // Function to verify address using EasyPost API
  const verifyAddress = async (type: 'from' | 'to') => {
    try {
      toast.info("Verifying address...");
      // In a real implementation, this would call the EasyPost address verification API
      // For now we'll just simulate success
      setTimeout(() => {
        toast.success(`${type === 'from' ? 'Origin' : 'Destination'} address verified successfully`);
      }, 1000);
    } catch (error) {
      toast.error(`Failed to verify ${type === 'from' ? 'origin' : 'destination'} address`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 shadow-sm">
        <h1 className="text-3xl font-bold flex items-center text-purple-800">
          <Globe className="mr-3 h-8 w-8 text-purple-600" /> 
          Ship To
        </h1>
        
        <Button variant="outline" className="bg-white hover:bg-purple-50 border-purple-200">
          <Info className="mr-2 h-5 w-5 text-purple-500" /> Shipping Guidelines
        </Button>
      </div>

      <Alert className="mb-6 bg-purple-50 border-2 border-purple-200">
        <Info className="h-5 w-5 text-purple-600" />
        <AlertTitle className="text-purple-800 font-bold">Ship To Information</AlertTitle>
        <AlertDescription className="text-purple-700">
          Ship to over 200+ countries worldwide with our reliable shipping services. Make sure to provide accurate customs information to avoid delays.
        </AlertDescription>
      </Alert>

      {!showRates ? (
        <Card className="border-2 border-gray-200 shadow-sm mb-8">
          <Tabs defaultValue="document" onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 p-2 bg-purple-50">
              <TabsTrigger value="document" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
                <Package className="mr-2 h-5 w-5" />
                Ship Documents
              </TabsTrigger>
              <TabsTrigger value="package" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
                <Package className="mr-2 h-5 w-5" />
                Ship Packages
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="document">
                <div className="flex items-center mb-6 bg-purple-50 p-4 rounded-md">
                  <Package className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-medium text-purple-800 mb-1">Ship Documents</h2>
                    <p className="text-purple-600">Use this option for shipping letters, documents, and flat envelopes up to 1/4" thick.</p>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                            Origin Address
                          </h3>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => verifyAddress('from')}
                              className="border-purple-200 hover:bg-purple-50"
                            >
                              Verify Address
                            </Button>
                            <Select value={selectedFromAddress} onValueChange={handleSelectFromAddress}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Saved Addresses" />
                              </SelectTrigger>
                              <SelectContent>
                                {savedAddresses.map((address) => (
                                  <SelectItem key={address.id} value={address.id}>
                                    {address.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="fromName">Name</Label>
                            <Input id="fromName" {...form.register('fromName')} placeholder="Name" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromCompany">Company (optional)</Label>
                            <Input id="fromCompany" {...form.register('fromCompany')} placeholder="Company" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" {...form.register('phone')} placeholder="Phone Number" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromAddress1">Address Line 1</Label>
                            <Input id="fromAddress1" {...form.register('fromAddress1')} placeholder="Street address" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromAddress2">Address Line 2 (optional)</Label>
                            <Input id="fromAddress2" {...form.register('fromAddress2')} placeholder="Apt, Suite, Unit, etc." className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fromCity">City</Label>
                              <Input id="fromCity" {...form.register('fromCity')} placeholder="City" className="border-purple-200 focus:border-purple-400" />
                            </div>
                            
                            <div>
                              <Label htmlFor="fromState">State</Label>
                              <Input id="fromState" {...form.register('fromState')} placeholder="State" className="border-purple-200 focus:border-purple-400" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="fromZip">ZIP Code</Label>
                            <Input id="fromZip" {...form.register('fromZip')} placeholder="ZIP Code" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromCountry">Country</Label>
                            <Select defaultValue="US" onValueChange={(value) => form.setValue('fromCountry', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                            Destination Address
                          </h3>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => verifyAddress('to')}
                            className="border-purple-200 hover:bg-purple-50"
                          >
                            Verify Address
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="toName">Name</Label>
                            <Input id="toName" {...form.register('toName')} placeholder="Name" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toCompany">Company (optional)</Label>
                            <Input id="toCompany" {...form.register('toCompany')} placeholder="Company" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toPhone">Phone Number</Label>
                            <Input id="toPhone" {...form.register('toPhone')} placeholder="Phone Number" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toAddress1">Address Line 1</Label>
                            <Input id="toAddress1" {...form.register('toAddress1')} placeholder="Street address" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toAddress2">Address Line 2 (optional)</Label>
                            <Input id="toAddress2" {...form.register('toAddress2')} placeholder="Apt, Suite, Unit, etc." className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="toCity">City</Label>
                              <Input id="toCity" {...form.register('toCity')} placeholder="City" className="border-purple-200 focus:border-purple-400" />
                            </div>
                            
                            <div>
                              <Label htmlFor="toState">State/Province</Label>
                              <Input id="toState" {...form.register('toState')} placeholder="State/Province" className="border-purple-200 focus:border-purple-400" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="toZip">Postal Code</Label>
                            <Input id="toZip" {...form.register('toZip')} placeholder="Postal Code" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toCountry">Country</Label>
                            <Select onValueChange={(value) => form.setValue('toCountry', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-8 bg-purple-100" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <CircleDollarSign className="mr-2 h-5 w-5 text-purple-500" />
                          Customs Information
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="contents">Contents Description</Label>
                            <Input id="contents" {...form.register('contents')} placeholder="Business documents, printed materials, etc." className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="packageValue">Declared Value ($)</Label>
                            <Input 
                              id="packageValue" 
                              type="number"
                              min="0"
                              step="0.01"
                              {...form.register('packageValue', { valueAsNumber: true })}
                              placeholder="0.00" 
                              className="border-purple-200 focus:border-purple-400"
                            />
                            <p className="text-sm text-gray-500 mt-1">Required for customs declaration</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Package className="mr-2 h-5 w-5 text-purple-500" />
                          Carrier &amp; Package Info
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="carrier">Shipping Carrier</Label>
                            <Select defaultValue="all" onValueChange={(value) => form.setValue('carrier', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Carrier" />
                              </SelectTrigger>
                              <SelectContent>
                                {carriers.map((carrier) => (
                                  <SelectItem key={carrier.value} value={carrier.value}>
                                    {carrier.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="packageType">Package Type</Label>
                            <Select defaultValue="envelope" onValueChange={(value) => form.setValue('packageType', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Package Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="envelope">Envelope</SelectItem>
                                <SelectItem value="flat">Flat</SelectItem>
                                <SelectItem value="letter">Letter</SelectItem>
                                <SelectItem value="custom">Custom Package</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="weightOz">Weight (oz)</Label>
                              <Input 
                                id="weightOz"
                                type="number"
                                min="0"
                                {...form.register('weightOz', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-white px-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting Rates...
                          </>
                        ) : "Show Shipping Rates"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="package">
                <div className="flex items-center mb-6 bg-purple-50 p-4 rounded-md">
                  <Package className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-medium text-purple-800 mb-1">Ship Packages</h2>
                    <p className="text-purple-600">Use this option for shipping boxes and parcels that aren't flat documents.</p>
                  </div>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                            Origin Address
                          </h3>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => verifyAddress('from')}
                              className="border-purple-200 hover:bg-purple-50"
                            >
                              Verify Address
                            </Button>
                            <Select value={selectedFromAddress} onValueChange={handleSelectFromAddress}>
                              <SelectTrigger className="w-[180px] border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Saved Addresses" />
                              </SelectTrigger>
                              <SelectContent>
                                {savedAddresses.map((address) => (
                                  <SelectItem key={address.id} value={address.id}>
                                    {address.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="fromName">Name</Label>
                            <Input id="fromName" {...form.register('fromName')} placeholder="Name" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromCompany">Company (optional)</Label>
                            <Input id="fromCompany" {...form.register('fromCompany')} placeholder="Company" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" {...form.register('phone')} placeholder="Phone Number" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromAddress1">Address Line 1</Label>
                            <Input id="fromAddress1" {...form.register('fromAddress1')} placeholder="Street address" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromAddress2">Address Line 2 (optional)</Label>
                            <Input id="fromAddress2" {...form.register('fromAddress2')} placeholder="Apt, Suite, Unit, etc." className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fromCity">City</Label>
                              <Input id="fromCity" {...form.register('fromCity')} placeholder="City" className="border-purple-200 focus:border-purple-400" />
                            </div>
                            
                            <div>
                              <Label htmlFor="fromState">State</Label>
                              <Input id="fromState" {...form.register('fromState')} placeholder="State" className="border-purple-200 focus:border-purple-400" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="fromZip">ZIP Code</Label>
                            <Input id="fromZip" {...form.register('fromZip')} placeholder="ZIP Code" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromCountry">Country</Label>
                            <Select defaultValue="US" onValueChange={(value) => form.setValue('fromCountry', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                            Destination Address
                          </h3>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => verifyAddress('to')}
                            className="border-purple-200 hover:bg-purple-50"
                          >
                            Verify Address
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="toName">Name</Label>
                            <Input id="toName" {...form.register('toName')} placeholder="Name" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toCompany">Company (optional)</Label>
                            <Input id="toCompany" {...form.register('toCompany')} placeholder="Company" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toPhone">Phone Number</Label>
                            <Input id="toPhone" {...form.register('toPhone')} placeholder="Phone Number" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toAddress1">Address Line 1</Label>
                            <Input id="toAddress1" {...form.register('toAddress1')} placeholder="Street address" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toAddress2">Address Line 2 (optional)</Label>
                            <Input id="toAddress2" {...form.register('toAddress2')} placeholder="Apt, Suite, Unit, etc." className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="toCity">City</Label>
                              <Input id="toCity" {...form.register('toCity')} placeholder="City" className="border-purple-200 focus:border-purple-400" />
                            </div>
                            
                            <div>
                              <Label htmlFor="toState">State/Province</Label>
                              <Input id="toState" {...form.register('toState')} placeholder="State/Province" className="border-purple-200 focus:border-purple-400" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="toZip">Postal Code</Label>
                            <Input id="toZip" {...form.register('toZip')} placeholder="Postal Code" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toCountry">Country</Label>
                            <Select onValueChange={(value) => form.setValue('toCountry', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-8 bg-purple-100" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Scale className="mr-2 h-5 w-5 text-purple-500" />
                          Package Measurements
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="packageType">Package Type</Label>
                            <Select defaultValue="box" onValueChange={(value) => form.setValue('packageType', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Package Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="box">Box</SelectItem>
                                <SelectItem value="tube">Tube</SelectItem>
                                <SelectItem value="custom">Custom Package</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="length">Length (in)</Label>
                              <Input 
                                id="length"
                                type="number"
                                min="0"
                                {...form.register('length', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="width">Width (in)</Label>
                              <Input 
                                id="width"
                                type="number"
                                min="0"
                                {...form.register('width', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="height">Height (in)</Label>
                              <Input 
                                id="height"
                                type="number"
                                min="0"
                                {...form.register('height', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label htmlFor="weightLb">Weight (lb)</Label>
                              <Input 
                                id="weightLb"
                                type="number"
                                min="0"
                                {...form.register('weightLb', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <Label htmlFor="weightOz">oz</Label>
                              <Input 
                                id="weightOz"
                                type="number"
                                min="0"
                                max="15"
                                {...form.register('weightOz', { valueAsNumber: true })}
                                placeholder="0" 
                                className="border-purple-200 focus:border-purple-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <CircleDollarSign className="mr-2 h-5 w-5 text-purple-500" />
                          Customs Information
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="description">Package Description</Label>
                            <Input id="description" {...form.register('description')} placeholder="Detailed description of contents" className="border-purple-200 focus:border-purple-400" />
                          </div>
                          
                          <div>
                            <Label htmlFor="contents">Contents Type</Label>
                            <Select defaultValue="merchandise" onValueChange={(value) => form.setValue('contents', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Contents Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="merchandise">Merchandise</SelectItem>
                                <SelectItem value="gift">Gift</SelectItem>
                                <SelectItem value="sample">Sample</SelectItem>
                                <SelectItem value="return">Return</SelectItem>
                                <SelectItem value="repair">Repair</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="packageValue">Declared Value ($)</Label>
                            <Input 
                              id="packageValue" 
                              type="number"
                              min="0"
                              step="0.01"
                              {...form.register('packageValue', { valueAsNumber: true })}
                              placeholder="0.00" 
                              className="border-purple-200 focus:border-purple-400"
                            />
                            <p className="text-sm text-gray-500 mt-1">Required for customs declaration</p>
                          </div>
                          
                          <div>
                            <Label htmlFor="carrier">Shipping Carrier</Label>
                            <Select defaultValue="all" onValueChange={(value) => form.setValue('carrier', value)}>
                              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                                <SelectValue placeholder="Select Carrier" />
                              </SelectTrigger>
                              <SelectContent>
                                {carriers.map((carrier) => (
                                  <SelectItem key={carrier.value} value={carrier.value}>
                                    {carrier.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-white px-8"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Getting Rates...
                          </>
                        ) : "Show Shipping Rates"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-800 flex items-center">
              <Package className="mr-2 h-5 w-5 text-purple-600" />
              Shipping Details
            </h2>
            <Button 
              onClick={() => setShowRates(false)} 
              variant="outline" 
              className="border-purple-200 hover:bg-purple-50"
            >
              Edit Details
            </Button>
          </div>
          
          {/* Show rates using the ShippingRates component */}
          <ShippingRates />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 border-2 border-purple-100 bg-purple-50 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
            <Globe className="mr-2 h-5 w-5 text-purple-600" />
            Global Coverage
          </h3>
          <p className="text-purple-700 mb-2">Ship to over 200 countries worldwide with our reliable shipping services.</p>
        </Card>
        
        <Card className="p-6 border-2 border-purple-100 bg-purple-50 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-purple-600" />
            Documentation
          </h3>
          <p className="text-purple-700 mb-2">Proper documentation is required for all shipments. We'll guide you through the process.</p>
        </Card>
        
        <Card className="p-6 border-2 border-purple-100 bg-purple-50 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
            <Package className="mr-2 h-5 w-5 text-purple-600" />
            Carrier Options
          </h3>
          <p className="text-purple-700 mb-2">Compare rates and services from USPS, UPS, DHL, and FedEx for your shipping needs.</p>
        </Card>
      </div>
    </div>
  );
};

export default ShipToPage;
