
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, Package, FileText } from 'lucide-react';

const customsItemSchema = z.object({
  description: z.string().min(2, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  value: z.coerce.number().min(0.01, 'Value must be greater than 0'),
  weight: z.coerce.number().min(0.01, 'Weight must be greater than 0'),
  origin: z.string().min(2, 'Country of origin is required'),
  hsTariffNumber: z.string().optional(),
});

const customsFormSchema = z.object({
  packageType: z.enum(['gift', 'documents', 'commercial', 'sample', 'other']),
  contentsType: z.enum(['merchandise', 'documents', 'gift', 'sample', 'return', 'other']),
  contentsExplanation: z.string().min(3, 'Please provide details'),
  customsItems: z.array(customsItemSchema).min(1, 'At least one item must be added'),
  parcelLength: z.coerce.number().min(1, 'Length must be at least 1'),
  parcelWidth: z.coerce.number().min(1, 'Width must be at least 1'),
  parcelHeight: z.coerce.number().min(1, 'Height must be at least 1'),
  parcelWeight: z.coerce.number().min(0.1, 'Weight must be at least 0.1'),
  senderSignature: z.string().min(2, 'Signature is required'),
});

type CustomsFormValues = z.infer<typeof customsFormSchema>;
type CustomsItem = z.infer<typeof customsItemSchema>;

interface CustomsInfoFormProps {
  onSubmit: (data: CustomsFormValues) => void;
  initialData?: any;
}

const CustomsInfoForm: React.FC<CustomsInfoFormProps> = ({ onSubmit, initialData }) => {
  const [newItem, setNewItem] = useState<CustomsItem>({
    description: '',
    quantity: 1,
    value: 0,
    weight: 0,
    origin: 'US',
    hsTariffNumber: '',
  });

  const form = useForm<CustomsFormValues>({
    resolver: zodResolver(customsFormSchema),
    defaultValues: initialData || {
      packageType: 'merchandise',
      contentsType: 'merchandise',
      contentsExplanation: '',
      customsItems: [],
      parcelLength: 10,
      parcelWidth: 8,
      parcelHeight: 6,
      parcelWeight: 1,
      senderSignature: '',
    },
  });

  const customsItems = form.watch('customsItems') || [];

  const addItem = () => {
    if (newItem.description && newItem.quantity > 0 && newItem.value > 0) {
      const updatedItems = [...customsItems, newItem];
      form.setValue('customsItems', updatedItems);
      setNewItem({
        description: '',
        quantity: 1,
        value: 0,
        weight: 0,
        origin: 'US',
        hsTariffNumber: '',
      });
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = customsItems.filter((_, i) => i !== index);
    form.setValue('customsItems', updatedItems);
  };

  const calculateTotalValue = () => {
    return customsItems.reduce((sum, item) => sum + (item.value * item.quantity), 0).toFixed(2);
  };

  const calculateTotalWeight = () => {
    return customsItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0).toFixed(2);
  };

  const handleSubmit = (values: CustomsFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Package Content Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Customs Declaration</h3>
            </div>

            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Package Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="gift" />
                        </FormControl>
                        <FormLabel className="font-normal">Gift</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="documents" />
                        </FormControl>
                        <FormLabel className="font-normal">Documents</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="commercial" />
                        </FormControl>
                        <FormLabel className="font-normal">Commercial Sample</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sample" />
                        </FormControl>
                        <FormLabel className="font-normal">Merchandise</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="other" />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentsType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contents Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contents type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="merchandise">Merchandise</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="sample">Commercial Sample</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentsExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of Contents</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of package contents"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2 mt-8 mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium">Package Dimensions</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parcelLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (in)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parcelWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width (in)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parcelHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (in)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parcelWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lb)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Customs Items */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Customs Items</h3>

            <div className="space-y-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <FormLabel>Description</FormLabel>
                      <Input
                        placeholder="Item description"
                        value={newItem.description}
                        onChange={(e) => 
                          setNewItem({...newItem, description: e.target.value})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Country of Origin</FormLabel>
                      <Select 
                        value={newItem.origin}
                        onValueChange={(value) => 
                          setNewItem({...newItem, origin: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CN">China</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="IN">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <FormLabel>Quantity</FormLabel>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => 
                          setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Value (USD)</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newItem.value || ''}
                        onChange={(e) => 
                          setNewItem({...newItem, value: parseFloat(e.target.value) || 0})
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Weight (lb)</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newItem.weight || ''}
                        onChange={(e) => 
                          setNewItem({...newItem, weight: parseFloat(e.target.value) || 0})
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>HS Tariff Number (Optional)</FormLabel>
                    <Input
                      placeholder="e.g., 8471.30.0100"
                      value={newItem.hsTariffNumber || ''}
                      onChange={(e) => 
                        setNewItem({...newItem, hsTariffNumber: e.target.value})
                      }
                    />
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            </div>

            {customsItems.length > 0 ? (
              <div className="space-y-4 mt-6">
                <h4 className="font-medium">Added Items</h4>
                {customsItems.map((item, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="pt-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            <p>Qty: {item.quantity} × ${item.value.toFixed(2)} = ${(item.quantity * item.value).toFixed(2)}</p>
                            <p>Weight: {item.weight}lb × {item.quantity} = {(item.weight * item.quantity).toFixed(2)}lb</p>
                            <p>Origin: {item.origin}</p>
                            {item.hsTariffNumber && <p>HS: {item.hsTariffNumber}</p>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => removeItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Total Value:</span>
                    <span className="font-bold">${calculateTotalValue()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Weight:</span>
                    <span className="font-bold">{calculateTotalWeight()} lb</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No items added yet</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="senderSignature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender's Signature (type your full name)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full md:w-auto">
          Continue to Shipping Rates
        </Button>
      </form>
    </Form>
  );
};

export default CustomsInfoForm;
