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
import ShippingLabel from '@/components/shipping/ShippingLabel';

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

const InternationalShippingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('document');
  const [isLoading, setIsLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const { rates, selectedRateId, handleSelectRate, bestValueRateId, fastestRateId } = useShippingRates();
  
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
      
      // Dispatch custom event with shipping rates
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: {
          rates: shippingRates,
          shipmentId: shippingRates[0]?.shipment_id || null,
        }
      });
      
      document.dispatchEvent(ratesEvent);
      setShowRates(true);
      toast.success("International shipping rates retrieved successfully");
    } catch (error) {
      console.error("Error getting international shipping rates:", error);
      toast.error("Failed to get international shipping rates. Please try again.");
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

  // Add this for label-related functionality
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  
  const handleCreateLabel = async (rateId: string, shipmentId: string | undefined) => {
    if (!rateId || !shipmentId) {
      toast.error("Cannot create label: Missing rate or shipment information");
      return;
    }
    
    setIsCreatingLabel(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-international-label', {
        body: { shipmentId, rateId }
      });
      
      if (error || !data) {
        console.error("Error creating international label:", error);
        throw new Error(error?.message || "Failed to create international shipping label");
      }
      
      if (!data.labelUrl) {
        throw new Error("No label URL returned");
      }
      
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      toast.success("International shipping label created successfully");
      
      // Download the label automatically
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = data.labelUrl;
        link.setAttribute('download', `international_shipping_label_${data.trackingCode || 'download'}.pdf`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1000);
      
      // Navigate to success page
      navigate(`/label-success?labelUrl=${encodeURIComponent(data.labelUrl)}&trackingCode=${encodeURIComponent(data.trackingCode || '')}`);
    } catch (error) {
      console.error("Label creation error:", error);
      toast.error("Failed to create international label. Please try again.");
    } finally {
      setIsCreatingLabel(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
        <h1 className="text-3xl font-bold flex items-center text-indigo-800">
          <Globe className="mr-3 h-8 w-8 text-indigo-600" /> 
          International Shipping
        </h1>
        
        <Button variant="outline" className="bg-white hover:bg-indigo-50 border-indigo-200">
          <Info className="mr-2 h-5 w-5 text-indigo-500" /> Shipping Guidelines
        </Button>
      </div>

      <Alert className="mb-6 bg-indigo-50 border-2 border-indigo-200">
        <Info className="h-5 w-5 text-indigo-600" />
        <AlertTitle className="text-indigo-800 font-bold">International Shipping Information</AlertTitle>
        <AlertDescription className="text-indigo-700">
          Ship to over 200+ countries worldwide with our reliable international shipping services. Make sure to provide accurate customs information to avoid delays. All international shipments require customs forms.
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-gray-200 shadow-sm mb-8">
        <Tabs defaultValue="document" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 p-2 bg-indigo-50">
            <TabsTrigger value="document" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
              <Package className="mr-2 h-5 w-5" />
              Ship Documents
            </TabsTrigger>
            <TabsTrigger value="package" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
              <Package className="mr-2 h-5 w-5" />
              Ship Packages
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            <TabsContent value="document">
              <div className="flex items-center mb-6 bg-indigo-50 p-4 rounded-md">
                <Package className="h-6 w-6 text-indigo-600 mr-3" />
                <div>
                  <h2 className="text-xl font-medium text-indigo-800 mb-1">Ship Documents Internationally</h2>
                  <p className="text-indigo-600">Use this option for shipping letters, documents, and flat envelopes up to 1/4" thick.</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                          Origin Address
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => verifyAddress('from')}
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
                          <Input id="fromName" {...form.register('fromName')} placeholder="Name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromCompany">Company (optional)</Label>
                          <Input id="fromCompany" {...form.register('fromCompany')} placeholder="Company" />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" {...form.register('phone')} placeholder="Phone Number" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromAddress1">Address Line 1</Label>
                          <Input id="fromAddress1" {...form.register('fromAddress1')} placeholder="Street address" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromAddress2">Address Line 2 (optional)</Label>
                          <Input id="fromAddress2" {...form.register('fromAddress2')} placeholder="Apt, Suite, Unit, etc." />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fromCity">City</Label>
                            <Input id="fromCity" {...form.register('fromCity')} placeholder="City" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromState">State</Label>
                            <Input id="fromState" {...form.register('fromState')} placeholder="State" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="fromZip">ZIP Code</Label>
                          <Input id="fromZip" {...form.register('fromZip')} placeholder="ZIP Code" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromCountry">Country</Label>
                          <Select defaultValue="US" onValueChange={(value) => form.setValue('fromCountry', value)}>
                            <SelectTrigger>
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
                          <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                          Destination Address
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => verifyAddress('to')}
                        >
                          Verify Address
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="toName">Name</Label>
                          <Input id="toName" {...form.register('toName')} placeholder="Name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toCompany">Company (optional)</Label>
                          <Input id="toCompany" {...form.register('toCompany')} placeholder="Company" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toPhone">Phone Number</Label>
                          <Input id="toPhone" {...form.register('toPhone')} placeholder="Phone Number" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toAddress1">Address Line 1</Label>
                          <Input id="toAddress1" {...form.register('toAddress1')} placeholder="Street address" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toAddress2">Address Line 2 (optional)</Label>
                          <Input id="toAddress2" {...form.register('toAddress2')} placeholder="Apt, Suite, Unit, etc." />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="toCity">City</Label>
                            <Input id="toCity" {...form.register('toCity')} placeholder="City" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toState">State/Province</Label>
                            <Input id="toState" {...form.register('toState')} placeholder="State/Province" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="toZip">Postal Code</Label>
                          <Input id="toZip" {...form.register('toZip')} placeholder="Postal Code" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toCountry">Country</Label>
                          <Select onValueChange={(value) => form.setValue('toCountry', value)}>
                            <SelectTrigger>
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
                  
                  <Separator className="my-8" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <CircleDollarSign className="mr-2 h-5 w-5 text-indigo-500" />
                        Customs Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contents">Contents Description</Label>
                          <Input id="contents" {...form.register('contents')} placeholder="Business documents, printed materials, etc." />
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
                          />
                          <p className="text-sm text-gray-500 mt-1">Required for customs declaration</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-indigo-500" />
                        Carrier &amp; Package Info
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="carrier">Shipping Carrier</Label>
                          <Select defaultValue="all" onValueChange={(value) => form.setValue('carrier', value)}>
                            <SelectTrigger>
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
                            <SelectTrigger>
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
                            <Label htmlFor="weightLb">Weight (oz)</Label>
                            <Input 
                              id="weightOz"
                              type="number"
                              min="0"
                              {...form.register('weightOz', { valueAsNumber: true })}
                              placeholder="0" 
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
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-white px-8"
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
              <div className="flex items-center mb-6 bg-amber-50 p-4 rounded-md">
                <Package className="h-6 w-6 text-amber-600 mr-3" />
                <div>
                  <h2 className="text-xl font-medium text-amber-800 mb-1">Ship Packages Internationally</h2>
                  <p className="text-amber-600">Use this option for shipping boxes and parcels that aren't flat documents.</p>
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-amber-500" />
                          Origin Address
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => verifyAddress('from')}
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
                          <Input id="fromName" {...form.register('fromName')} placeholder="Name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromCompany">Company (optional)</Label>
                          <Input id="fromCompany" {...form.register('fromCompany')} placeholder="Company" />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" {...form.register('phone')} placeholder="Phone Number" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromAddress1">Address Line 1</Label>
                          <Input id="fromAddress1" {...form.register('fromAddress1')} placeholder="Street address" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromAddress2">Address Line 2 (optional)</Label>
                          <Input id="fromAddress2" {...form.register('fromAddress2')} placeholder="Apt, Suite, Unit, etc." />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fromCity">City</Label>
                            <Input id="fromCity" {...form.register('fromCity')} placeholder="City" />
                          </div>
                          
                          <div>
                            <Label htmlFor="fromState">State</Label>
                            <Input id="fromState" {...form.register('fromState')} placeholder="State" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="fromZip">ZIP Code</Label>
                          <Input id="fromZip" {...form.register('fromZip')} placeholder="ZIP Code" />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromCountry">Country</Label>
                          <Select defaultValue="US" onValueChange={(value) => form.setValue('fromCountry', value)}>
                            <SelectTrigger>
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
                          <MapPin className="mr-2 h-5 w-5 text-amber-500" />
                          Destination Address
                        </h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => verifyAddress('to')}
                        >
                          Verify Address
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="toName">Name</Label>
                          <Input id="toName" {...form.register('toName')} placeholder="Name" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toCompany">Company (optional)</Label>
                          <Input id="toCompany" {...form.register('toCompany')} placeholder="Company" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toPhone">Phone Number</Label>
                          <Input id="toPhone" {...form.register('toPhone')} placeholder="Phone Number" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toAddress1">Address Line 1</Label>
                          <Input id="toAddress1" {...form.register('toAddress1')} placeholder="Street address" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toAddress2">Address Line 2 (optional)</Label>
                          <Input id="toAddress2" {...form.register('toAddress2')} placeholder="Apt, Suite, Unit, etc." />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="toCity">City</Label>
                            <Input id="toCity" {...form.register('toCity')} placeholder="City" />
                          </div>
                          
                          <div>
                            <Label htmlFor="toState">State/Province</Label>
                            <Input id="toState" {...form.register('toState')} placeholder="State/Province" />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="toZip">Postal Code</Label>
                          <Input id="toZip" {...form.register('toZip')} placeholder="Postal Code" />
                        </div>
                        
                        <div>
                          <Label htmlFor="toCountry">Country</Label>
                          <Select onValueChange={(value) => form.setValue('toCountry', value)}>
                            <SelectTrigger>
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
                  
                  <Separator className="my-8" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Scale className="mr-2 h-5 w-5 text-amber-500" />
                        Package Measurements
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="packageType">Package Type</Label>
                          <Select defaultValue="box" onValueChange={(value) => form.setValue('packageType', value)}>
                            <SelectTrigger>
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
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <CircleDollarSign className="mr-2 h-5 w-5 text-amber-500" />
                        Customs Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="description">Package Description</Label>
                          <Input id="description" {...form.register('description')} placeholder="Detailed description of contents" />
                        </div>
                        
                        <div>
                          <Label htmlFor="contents">Contents Type</Label>
                          <Select defaultValue="merchandise" onValueChange={(value) => form.setValue('contents', value)}>
                            <SelectTrigger>
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
                          />
                          <p className="text-sm text-gray-500 mt-1">Required for customs declaration</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="carrier">Shipping Carrier</Label>
                          <Select defaultValue="all" onValueChange={(value) => form.setValue('carrier', value)}>
                            <SelectTrigger>
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
                      className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2 text-white px-8"
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

      {/* Display label if available */}
      {labelUrl && (
        <ShippingLabel 
          labelUrl={labelUrl} 
          trackingCode={trackingCode} 
          shipmentId={shipmentId}
        />
      )}

      {/* Display shipping rates when available */}
      {showRates && rates.length > 0 && (
        <Card className="border-2 border-indigo-200 shadow-sm mb-8 p-6 bg-white rounded-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-indigo-800">
            <Package className="mr-2 h-6 w-6 text-indigo-600" /> 
            Available Shipping Options
          </h2>
          
          <div className="space-y-4">
            {rates.map((rate) => (
              <div 
                key={rate.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRateId === rate.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => handleSelectRate(rate.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-semibold text-lg">{rate.carrier.toUpperCase()} - {rate.service}</h3>
                      {bestValueRateId === rate.id && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Best Value
                        </span>
                      )}
                      {fastestRateId === rate.id && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Fastest
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      Estimated delivery: {rate.delivery_date || `${rate.delivery_days || '3-5'} days`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-700">${rate.rate}</p>
                    {rate.list_rate && rate.list_rate !== rate.rate && (
                      <p className="text-sm text-gray-500 line-through">${rate.list_rate}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!selectedRateId || isCreatingLabel}
              onClick={() => {
                if (selectedRateId) {
                  const rate = rates.find(r => r.id === selectedRateId);
                  if (rate && rate.shipment_id) {
                    handleCreateLabel(selectedRateId, rate.shipment_id);
                  } else {
                    toast.error("Missing shipment information");
                  }
                }
              }}
              className="border-indigo-200 hover:bg-indigo-50"
            >
              {isCreatingLabel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Label...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create & Download Label
                </>
              )}
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!selectedRateId}
              onClick={() => {
                if (selectedRateId) {
                  const rate = rates.find(r => r.id === selectedRateId);
                  if (rate && rate.shipment_id) {
                    navigate(`/payment?amount=${Math.round(parseFloat(rate.rate) * 100)}&shipmentId=${rate.shipment_id}&rateId=${selectedRateId}`);
                  } else {
                    toast.error("Missing shipment information");
                  }
                }
              }}
            >
              Proceed to Payment
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 border-2 border-blue-100 bg-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center">
            <Globe className="mr-2 h-5 w-5 text-blue-600" />
            International Coverage
          </h3>
          <p className="text-blue-700 mb-2">Ship to over 200 countries and territories worldwide with our reliable international shipping services.</p>
        </Card>
        
        <Card className="p-6 border-2 border-amber-100 bg-amber-50">
          <h3 className="text-lg font-semibold mb-3 text-amber-800 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
            Customs Information
          </h3>
          <p className="text-amber-700 mb-2">Proper customs documentation is required for all international shipments. We'll guide you through the process.</p>
        </Card>
        
        <Card className="p-6 border-2 border-green-100 bg-green-50">
          <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
            <Package className="mr-2 h-5 w-5 text-green-600" />
            Carrier Options
          </h3>
          <p className="text-green-700 mb-2">Compare rates and services from USPS, UPS, DHL, and FedEx for your international shipping needs.</p>
        </Card>
      </div>
    </div>
  );
};

export default InternationalShippingPage;
