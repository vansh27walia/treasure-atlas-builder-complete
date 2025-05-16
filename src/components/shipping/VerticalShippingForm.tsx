
import React, { useState } from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn } from 'react-hook-form';
import { MapPin, Package, Scale, CircleDollarSign, Loader2, ArrowRight } from 'lucide-react';

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

interface VerticalShippingFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading: boolean;
  countries: Array<{ value: string, label: string }>;
  carriers: Array<{ value: string, label: string }>;
  savedAddresses: Array<{ id: string, name: string, street: string, city: string, state: string, zip: string }>;
  selectedFromAddress: string;
  onSelectFromAddress: (id: string) => void;
  verifyAddress: (type: 'from' | 'to') => void;
  shipmentType: 'document' | 'package';
}

const VerticalShippingForm: React.FC<VerticalShippingFormProps> = ({
  form,
  onSubmit,
  isLoading,
  countries,
  carriers,
  savedAddresses,
  selectedFromAddress,
  onSelectFromAddress,
  verifyAddress,
  shipmentType,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Origin Address */}
        <div className="bg-white p-6 rounded-lg border-2 border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center text-purple-800">
              <MapPin className="mr-2 h-5 w-5 text-purple-600" />
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
              <Select value={selectedFromAddress} onValueChange={onSelectFromAddress}>
                <SelectTrigger className="w-[180px] border-purple-200">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fromName">Name</Label>
              <Input id="fromName" {...form.register('fromName')} placeholder="Name" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="fromCompany">Company (optional)</Label>
              <Input id="fromCompany" {...form.register('fromCompany')} placeholder="Company" className="mt-1" />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...form.register('phone')} placeholder="Phone Number" className="mt-1" />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="fromAddress1">Address Line 1</Label>
            <Input id="fromAddress1" {...form.register('fromAddress1')} placeholder="Street address" className="mt-1" />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="fromAddress2">Address Line 2 (optional)</Label>
            <Input id="fromAddress2" {...form.register('fromAddress2')} placeholder="Apt, Suite, Unit, etc." className="mt-1" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="fromCity">City</Label>
              <Input id="fromCity" {...form.register('fromCity')} placeholder="City" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="fromState">State</Label>
              <Input id="fromState" {...form.register('fromState')} placeholder="State" className="mt-1" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="fromZip">ZIP Code</Label>
              <Input id="fromZip" {...form.register('fromZip')} placeholder="ZIP Code" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="fromCountry">Country</Label>
              <Select defaultValue="US" onValueChange={(value) => form.setValue('fromCountry', value)}>
                <SelectTrigger className="mt-1 border-purple-200">
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
        
        {/* Destination Address */}
        <div className="bg-white p-6 rounded-lg border-2 border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center text-purple-800">
              <MapPin className="mr-2 h-5 w-5 text-purple-600" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="toName">Name</Label>
              <Input id="toName" {...form.register('toName')} placeholder="Name" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="toCompany">Company (optional)</Label>
              <Input id="toCompany" {...form.register('toCompany')} placeholder="Company" className="mt-1" />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="toPhone">Phone Number</Label>
            <Input id="toPhone" {...form.register('toPhone')} placeholder="Phone Number" className="mt-1" />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="toAddress1">Address Line 1</Label>
            <Input id="toAddress1" {...form.register('toAddress1')} placeholder="Street address" className="mt-1" />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="toAddress2">Address Line 2 (optional)</Label>
            <Input id="toAddress2" {...form.register('toAddress2')} placeholder="Apt, Suite, Unit, etc." className="mt-1" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="toCity">City</Label>
              <Input id="toCity" {...form.register('toCity')} placeholder="City" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="toState">State/Province</Label>
              <Input id="toState" {...form.register('toState')} placeholder="State/Province" className="mt-1" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="toZip">Postal Code</Label>
              <Input id="toZip" {...form.register('toZip')} placeholder="Postal Code" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="toCountry">Country</Label>
              <Select onValueChange={(value) => form.setValue('toCountry', value)}>
                <SelectTrigger className="mt-1 border-purple-200">
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
        
        {/* Package Information */}
        <div className="bg-white p-6 rounded-lg border-2 border-purple-100 shadow-sm">
          <h3 className="text-lg font-medium mb-4 flex items-center text-purple-800">
            <Package className="mr-2 h-5 w-5 text-purple-600" />
            Package Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="packageType">Package Type</Label>
              <Select 
                defaultValue={shipmentType === 'document' ? 'envelope' : 'box'} 
                onValueChange={(value) => form.setValue('packageType', value)}
              >
                <SelectTrigger className="mt-1 border-purple-200">
                  <SelectValue placeholder="Select Package Type" />
                </SelectTrigger>
                <SelectContent>
                  {shipmentType === 'document' ? (
                    <>
                      <SelectItem value="envelope">Envelope</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="custom">Custom Package</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="tube">Tube</SelectItem>
                      <SelectItem value="custom">Custom Package</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="carrier">Shipping Carrier</Label>
              <Select defaultValue="all" onValueChange={(value) => form.setValue('carrier', value)}>
                <SelectTrigger className="mt-1 border-purple-200">
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
          
          {shipmentType === 'package' && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input 
                  id="length"
                  type="number"
                  min="0"
                  {...form.register('length', { valueAsNumber: true })}
                  placeholder="0"
                  className="mt-1" 
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
                  className="mt-1"
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
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <div className={`grid grid-cols-${shipmentType === 'document' ? '1' : '2'} gap-4 mt-4`}>
            {shipmentType === 'package' && (
              <div>
                <Label htmlFor="weightLb">Weight (lb)</Label>
                <Input 
                  id="weightLb"
                  type="number"
                  min="0"
                  {...form.register('weightLb', { valueAsNumber: true })}
                  placeholder="0" 
                  className="mt-1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="weightOz">Weight (oz)</Label>
              <Input 
                id="weightOz"
                type="number"
                min="0"
                max={shipmentType === 'package' ? "15" : undefined}
                {...form.register('weightOz', { valueAsNumber: true })}
                placeholder="0" 
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        {/* Customs Information */}
        <div className="bg-white p-6 rounded-lg border-2 border-purple-100 shadow-sm">
          <h3 className="text-lg font-medium mb-4 flex items-center text-purple-800">
            <CircleDollarSign className="mr-2 h-5 w-5 text-purple-600" />
            Customs Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor={shipmentType === 'document' ? 'contents' : 'description'}>
                {shipmentType === 'document' ? 'Contents Description' : 'Package Description'}
              </Label>
              <Input 
                id={shipmentType === 'document' ? 'contents' : 'description'} 
                {...form.register(shipmentType === 'document' ? 'contents' : 'description')} 
                placeholder={shipmentType === 'document' ? "Business documents, printed materials, etc." : "Detailed description of contents"}
                className="mt-1" 
              />
            </div>
            
            {shipmentType === 'package' && (
              <div>
                <Label htmlFor="contents">Contents Type</Label>
                <Select defaultValue="merchandise" onValueChange={(value) => form.setValue('contents', value)}>
                  <SelectTrigger className="mt-1 border-purple-200">
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
            )}
          </div>
          
          <div className="mt-4">
            <Label htmlFor="packageValue">Declared Value ($)</Label>
            <Input 
              id="packageValue" 
              type="number"
              min="0"
              step="0.01"
              {...form.register('packageValue', { valueAsNumber: true })}
              placeholder="0.00" 
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">Required for customs declaration</p>
          </div>
        </div>
        
        <div className="flex justify-end">
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
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VerticalShippingForm;
