
import React, { useState } from 'react';
import { 
  X, ChevronsUpDown, Check, ArrowDown, CreditCard, Package,
  Download, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Shipping2SheetProps {
  onClose: () => void;
}

const Shipping2Sheet: React.FC<Shipping2SheetProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    fromCountry: 'US',
    toCountry: 'GB',
    fromName: '',
    toName: '',
    fromAddress: '',
    toAddress: '',
    fromCity: '',
    toCity: '',
    fromState: '',
    toState: '',
    fromZip: '',
    toZip: '',
    weight: '1',
    length: '10',
    width: '8',
    height: '6',
    contents: 'merchandise',
    value: '50',
    description: 'Clothing'
  });
  
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [labelGenerated, setLabelGenerated] = useState(false);
  const [labelUrl, setLabelUrl] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const dummyRates = [
    {
      id: 'usps_priority',
      carrier: 'USPS',
      service: 'Priority Mail International',
      rate: 48.99,
      delivery_days: 6,
      delivery_date: '2025-05-22'
    },
    {
      id: 'dhl_express',
      carrier: 'DHL',
      service: 'Express Worldwide',
      rate: 72.49,
      delivery_days: 3,
      delivery_date: '2025-05-19'
    },
    {
      id: 'fedex_intl',
      carrier: 'FedEx',
      service: 'International Priority',
      rate: 89.75,
      delivery_days: 2,
      delivery_date: '2025-05-18'
    }
  ];

  const handleNextStep = () => {
    if (activeTab === 'details') {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        toast.success("Shipping details saved successfully");
        setActiveTab('rates');
      }, 1500);
    } else if (activeTab === 'rates' && selectedRate) {
      setActiveTab('label');
    } else if (activeTab === 'rates') {
      toast.error("Please select a shipping rate");
    }
  };

  const handlePrevStep = () => {
    if (activeTab === 'rates') {
      setActiveTab('details');
    } else if (activeTab === 'label') {
      setActiveTab('rates');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectRate = (rateId: string) => {
    setSelectedRate(rateId);
  };

  const handleCreateLabel = () => {
    setGeneratingLabel(true);
    
    // Simulate label generation
    setTimeout(() => {
      setGeneratingLabel(false);
      setLabelGenerated(true);
      setLabelUrl('https://example.com/shipping-label.pdf');
      setTrackingNumber('SHIP2' + Math.floor(10000000 + Math.random() * 90000000));
      toast.success("Shipping label created successfully");
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <SheetHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-xl font-bold">Shipping 2</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SheetHeader>
      
      <div className="flex-1 overflow-y-auto py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details" disabled={isLoading}>
              1. Shipping Details
            </TabsTrigger>
            <TabsTrigger value="rates" disabled={isLoading || activeTab === 'details'}>
              2. Choose Rate
            </TabsTrigger>
            <TabsTrigger value="label" disabled={isLoading || activeTab === 'details' || activeTab === 'rates'}>
              3. Create Label
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Address */}
              <Card>
                <CardHeader>
                  <CardTitle>From</CardTitle>
                  <CardDescription>Sender's details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromCountry">Country</Label>
                    <Select 
                      name="fromCountry" 
                      value={shippingDetails.fromCountry} 
                      onValueChange={(value) => setShippingDetails(prev => ({ ...prev, fromCountry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="MX">Mexico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Full Name</Label>
                    <Input 
                      id="fromName" 
                      name="fromName" 
                      value={shippingDetails.fromName} 
                      onChange={handleInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromAddress">Street Address</Label>
                    <Input 
                      id="fromAddress" 
                      name="fromAddress" 
                      value={shippingDetails.fromAddress} 
                      onChange={handleInputChange}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromCity">City</Label>
                      <Input 
                        id="fromCity" 
                        name="fromCity" 
                        value={shippingDetails.fromCity} 
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromState">State</Label>
                      <Input 
                        id="fromState" 
                        name="fromState" 
                        value={shippingDetails.fromState} 
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromZip">Postal Code</Label>
                    <Input 
                      id="fromZip" 
                      name="fromZip" 
                      value={shippingDetails.fromZip} 
                      onChange={handleInputChange}
                      placeholder="ZIP/Postal Code"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* To Address */}
              <Card>
                <CardHeader>
                  <CardTitle>To</CardTitle>
                  <CardDescription>Recipient's details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="toCountry">Country</Label>
                    <Select 
                      name="toCountry" 
                      value={shippingDetails.toCountry} 
                      onValueChange={(value) => setShippingDetails(prev => ({ ...prev, toCountry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toName">Full Name</Label>
                    <Input 
                      id="toName" 
                      name="toName" 
                      value={shippingDetails.toName} 
                      onChange={handleInputChange}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toAddress">Street Address</Label>
                    <Input 
                      id="toAddress" 
                      name="toAddress" 
                      value={shippingDetails.toAddress} 
                      onChange={handleInputChange}
                      placeholder="456 High St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="toCity">City</Label>
                      <Input 
                        id="toCity" 
                        name="toCity" 
                        value={shippingDetails.toCity} 
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toState">State/Province</Label>
                      <Input 
                        id="toState" 
                        name="toState" 
                        value={shippingDetails.toState} 
                        onChange={handleInputChange}
                        placeholder="State/Province"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toZip">Postal Code</Label>
                    <Input 
                      id="toZip" 
                      name="toZip" 
                      value={shippingDetails.toZip} 
                      onChange={handleInputChange}
                      placeholder="Postal Code"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
                <CardDescription>Information about your package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input 
                        id="weight" 
                        name="weight" 
                        type="number" 
                        value={shippingDetails.weight} 
                        onChange={handleInputChange}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="length">Length (in)</Label>
                        <Input 
                          id="length" 
                          name="length" 
                          type="number" 
                          value={shippingDetails.length} 
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (in)</Label>
                        <Input 
                          id="width" 
                          name="width" 
                          type="number" 
                          value={shippingDetails.width} 
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (in)</Label>
                        <Input 
                          id="height" 
                          name="height" 
                          type="number" 
                          value={shippingDetails.height} 
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contents">Contents Type</Label>
                      <Select 
                        name="contents" 
                        value={shippingDetails.contents} 
                        onValueChange={(value) => setShippingDetails(prev => ({ ...prev, contents: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merchandise">Merchandise</SelectItem>
                          <SelectItem value="documents">Documents</SelectItem>
                          <SelectItem value="gift">Gift</SelectItem>
                          <SelectItem value="sample">Sample</SelectItem>
                          <SelectItem value="return">Return</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Value (USD)</Label>
                      <Input 
                        id="value" 
                        name="value" 
                        type="number" 
                        value={shippingDetails.value} 
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        name="description" 
                        value={shippingDetails.description} 
                        onChange={handleInputChange}
                        placeholder="Brief description of contents"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Shipping Rates</CardTitle>
                <CardDescription>Select a shipping option for your international package</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedRate || ''} onValueChange={handleSelectRate} className="space-y-4">
                  {dummyRates.map(rate => (
                    <div 
                      key={rate.id} 
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg",
                        selectedRate === rate.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={rate.id} id={rate.id} />
                        <div>
                          <Label htmlFor={rate.id} className="text-base font-medium">
                            {rate.carrier} - {rate.service}
                          </Label>
                          <p className="text-sm text-gray-600">
                            Delivery in {rate.delivery_days} days
                            <span className="mx-2">•</span>
                            Est. delivery by {rate.delivery_date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-700">
                          ${rate.rate.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="label" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Shipping Label</CardTitle>
                <CardDescription>Generate and download your international shipping label</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!labelGenerated ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                    <h3 className="text-xl font-medium mb-2">Ready to create your shipping label</h3>
                    <p className="text-gray-600 mb-6">
                      Click the button below to generate and download your shipping label
                    </p>
                    <Button 
                      onClick={handleCreateLabel} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={generatingLabel}
                    >
                      {generatingLabel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Label...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Generate Label
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-lg">Your Label is Ready!</h3>
                        <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                          Generated
                        </Badge>
                      </div>
                      
                      <div className="border border-gray-200 rounded-md bg-white p-2 mb-4">
                        <AspectRatio ratio={7/5}>
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                            <Package className="h-12 w-12" />
                          </div>
                        </AspectRatio>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tracking Number:</span>
                          <span className="font-medium">{trackingNumber}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">
                            {selectedRate && dummyRates.find(r => r.id === selectedRate)?.service}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estimated Delivery:</span>
                          <span className="font-medium">
                            {selectedRate && dummyRates.find(r => r.id === selectedRate)?.delivery_date}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                        href={labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Label
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Track Package
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation */}
      <div className="border-t mt-auto pt-4">
        <div className="flex justify-between">
          {activeTab !== 'details' ? (
            <Button variant="outline" onClick={handlePrevStep}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {activeTab !== 'label' || !labelGenerated ? (
            <Button 
              onClick={handleNextStep}
              disabled={isLoading || (activeTab === 'rates' && !selectedRate)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {activeTab === 'details' && 'Continue to Rates'}
                  {activeTab === 'rates' && 'Continue to Label'}
                  {activeTab === 'label' && !labelGenerated && 'Create Label'}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shipping2Sheet;
