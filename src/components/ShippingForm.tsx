
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import useRateCalculator from '@/hooks/useRateCalculator';

const ShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchRates } = useRateCalculator();
  
  // Basic form state
  const [formValues, setFormValues] = useState({
    fromName: '',
    fromAddress1: '',
    fromCity: '',
    fromState: '',
    fromZip: '',
    fromCountry: 'US',
    toName: '',
    toAddress1: '',
    toCity: '',
    toState: '',
    toZip: '',
    toCountry: 'US',
    weightLb: 1,
    weightOz: 0,
    length: 10,
    width: 8,
    height: 6,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Basic form validation
      if (!formValues.fromZip || !formValues.toZip) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate weight in ounces for API
      const weightOz = (formValues.weightLb * 16) + (formValues.weightOz || 0);
      
      // Prepare request data
      const requestData = {
        fromAddress: {
          zip: formValues.fromZip,
          country: formValues.fromCountry,
        },
        toAddress: {
          zip: formValues.toZip,
          country: formValues.toCountry,
        },
        parcel: {
          weight: weightOz,
          length: formValues.length,
          width: formValues.width,
          height: formValues.height,
        },
        options: {
          packageType: 'custom',
        }
      };
      
      // Call the rate calculator to fetch shipping rates
      await fetchRates(requestData);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to get shipping rates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Ship a Package</h2>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="domestic" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="domestic">Domestic</TabsTrigger>
                <TabsTrigger value="international">International</TabsTrigger>
              </TabsList>
              
              <TabsContent value="domestic" className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Origin Address */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Origin Address</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fromName">Name</Label>
                        <Input 
                          id="fromName"
                          name="fromName"
                          placeholder="Name"
                          value={formValues.fromName}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="fromAddress1">Address Line 1</Label>
                        <Input 
                          id="fromAddress1"
                          name="fromAddress1"
                          placeholder="Street address"
                          value={formValues.fromAddress1}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fromCity">City</Label>
                          <Input 
                            id="fromCity"
                            name="fromCity"
                            placeholder="City"
                            value={formValues.fromCity}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="fromState">State</Label>
                          <Input 
                            id="fromState"
                            name="fromState"
                            placeholder="State"
                            value={formValues.fromState}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="fromZip">ZIP Code</Label>
                        <Input 
                          id="fromZip"
                          name="fromZip"
                          placeholder="ZIP Code"
                          value={formValues.fromZip}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="fromCountry">Country</Label>
                        <Select 
                          value={formValues.fromCountry}
                          onValueChange={(value) => handleSelectChange('fromCountry', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="MX">Mexico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Destination Address */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Destination Address</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="toName">Name</Label>
                        <Input 
                          id="toName"
                          name="toName"
                          placeholder="Name"
                          value={formValues.toName}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="toAddress1">Address Line 1</Label>
                        <Input 
                          id="toAddress1"
                          name="toAddress1"
                          placeholder="Street address"
                          value={formValues.toAddress1}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="toCity">City</Label>
                          <Input 
                            id="toCity"
                            name="toCity"
                            placeholder="City"
                            value={formValues.toCity}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="toState">State</Label>
                          <Input 
                            id="toState"
                            name="toState"
                            placeholder="State"
                            value={formValues.toState}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="toZip">ZIP Code</Label>
                        <Input 
                          id="toZip"
                          name="toZip"
                          placeholder="ZIP Code"
                          value={formValues.toZip}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="toCountry">Country</Label>
                        <Select 
                          value={formValues.toCountry}
                          onValueChange={(value) => handleSelectChange('toCountry', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="MX">Mexico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="international" className="pt-6">
                <div className="p-4 bg-muted rounded-lg text-center">
                  International shipping options will appear here
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Package Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="weightLb">Weight (lb)</Label>
                      <Input 
                        id="weightLb"
                        name="weightLb"
                        type="number"
                        min="0"
                        value={formValues.weightLb}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="weightOz">oz</Label>
                      <Input 
                        id="weightOz"
                        name="weightOz"
                        type="number"
                        min="0"
                        max="15"
                        value={formValues.weightOz}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="length">Length (in)</Label>
                      <Input 
                        id="length"
                        name="length"
                        type="number"
                        min="0"
                        value={formValues.length}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="width">Width (in)</Label>
                      <Input 
                        id="width"
                        name="width"
                        type="number" 
                        min="0"
                        value={formValues.width}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="height">Height (in)</Label>
                      <Input 
                        id="height"
                        name="height"
                        type="number"
                        min="0"
                        value={formValues.height}
                        onChange={handleInputChange}
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
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Getting Rates...' : 'Show Shipping Rates'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ShippingForm;
