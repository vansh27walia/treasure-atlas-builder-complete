
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, ArrowRight, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface Shipping2SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Shipping2Sheet: React.FC<Shipping2SheetProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'address' | 'rates' | 'label'>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fromName: '',
    fromAddress: '',
    fromCity: '',
    fromCountry: 'US',
    toName: '',
    toAddress: '',
    toCity: '',
    toCountry: 'CA',
    weight: '',
    packageType: 'box',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetRates = async () => {
    setIsLoading(true);
    try {
      // This would typically call an API to get shipping rates
      // For demo purposes, we're simulating an API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock shipping rates
      const mockRates = [
        { id: '1', carrier: 'USPS', service: 'Priority International', rate: '45.67', delivery_days: 3 },
        { id: '2', carrier: 'UPS', service: 'Worldwide Expedited', rate: '58.99', delivery_days: 2 },
        { id: '3', carrier: 'FedEx', service: 'International Economy', rate: '62.34', delivery_days: 4 },
        { id: '4', carrier: 'DHL', service: 'Express Worldwide', rate: '72.50', delivery_days: 2 }
      ];
      
      setRates(mockRates);
      setStep('rates');
      toast("Successfully retrieved shipping rates");
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast("Failed to get shipping rates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };

  const handleCreateLabel = async () => {
    if (!selectedRateId) {
      toast("Please select a shipping rate first");
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate label creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLabelUrl('https://example.com/mock-label.pdf');
      setStep('label');
      toast("Label created successfully!");
    } catch (error) {
      console.error("Error creating label:", error);
      toast("Failed to create shipping label. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shipping 2</SheetTitle>
          <SheetDescription>
            Send packages internationally with our Shipping 2 service.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          {step === 'address' && (
            <div className="space-y-4">
              <div className="border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-3">From Address</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="fromName">Name</Label>
                    <Input
                      id="fromName"
                      name="fromName"
                      value={formData.fromName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromAddress">Address</Label>
                    <Input
                      id="fromAddress"
                      name="fromAddress"
                      value={formData.fromAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fromCity">City</Label>
                      <Input
                        id="fromCity"
                        name="fromCity"
                        value={formData.fromCity}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromCountry">Country</Label>
                      <Select
                        value={formData.fromCountry}
                        onValueChange={(value) => handleSelectChange('fromCountry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-3">To Address</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="toName">Name</Label>
                    <Input
                      id="toName"
                      name="toName"
                      value={formData.toName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toAddress">Address</Label>
                    <Input
                      id="toAddress"
                      name="toAddress"
                      value={formData.toAddress}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="toCity">City</Label>
                      <Input
                        id="toCity"
                        name="toCity"
                        value={formData.toCity}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="toCountry">Country</Label>
                      <Select
                        value={formData.toCountry}
                        onValueChange={(value) => handleSelectChange('toCountry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium text-lg mb-3">Package Details</h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="weight">Weight (lb)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      value={formData.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageType">Package Type</Label>
                    <Select
                      value={formData.packageType}
                      onValueChange={(value) => handleSelectChange('packageType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="envelope">Envelope</SelectItem>
                        <SelectItem value="tube">Tube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleGetRates}
                  disabled={isLoading}
                  className="flex items-center"
                >
                  {isLoading ? 'Getting Rates...' : 'Get Shipping Rates'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {step === 'rates' && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Available Shipping Rates</h3>
              
              <div className="space-y-2">
                {rates.map((rate) => (
                  <div 
                    key={rate.id}
                    className={`border p-3 rounded-md cursor-pointer ${selectedRateId === rate.id ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => handleSelectRate(rate.id)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{rate.carrier} - {rate.service}</p>
                        <p className="text-sm text-gray-500">Delivery in {rate.delivery_days} days</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${rate.rate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => setStep('address')}
                  variant="outline"
                  className="mr-2"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleCreateLabel}
                  disabled={!selectedRateId || isLoading}
                  className="flex items-center"
                >
                  {isLoading ? 'Creating Label...' : 'Create Shipping Label'}
                  <Download className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {step === 'label' && labelUrl && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Shipping Label Created</h3>
              
              <div className="border p-4 rounded-md bg-green-50">
                <div className="flex items-center space-x-2">
                  <Truck className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Your shipping label is ready!</p>
                    <p className="text-sm text-gray-600">You can download it below.</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-dashed p-8 rounded-md flex flex-col items-center justify-center">
                <p className="text-gray-500 mb-4">Label Preview</p>
                <Button 
                  onClick={() => window.open(labelUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center"
                >
                  Download Label
                  <Download className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => {
                    setStep('address');
                    setSelectedRateId(null);
                    setLabelUrl(null);
                  }}
                  variant="outline"
                >
                  Start New Shipment
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Shipping2Sheet;
