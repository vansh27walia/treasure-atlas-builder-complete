import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const customsItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  value: z.coerce.number().min(0.01, "Value must be greater than 0"),
  hs_tariff: z.string().optional(),
  origin_country: z.string().min(1, "Origin country is required"),
});

const customsFormSchema = z.object({
  items: z.array(customsItemSchema).min(1, "At least one item is required"),
  contents_type: z.enum(['gift', 'merchandise', 'documents', 'other']),
  customs_signer: z.string().min(1, "Customs signer is required"),
  non_delivery_option: z.enum(['return', 'abandon']),
  eel_pfc: z.string().optional(),
});

type CustomsFormValues = z.infer<typeof customsFormSchema>;

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customsData: any) => void;
}

const COUNTRIES = [
  'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'JP', 'AU', 'BR', 'MX', 'IN', 'CN'
];

const CustomsDocumentationModal: React.FC<CustomsDocumentationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomsFormValues>({
    resolver: zodResolver(customsFormSchema),
    defaultValues: {
      items: [
        {
          description: '',
          quantity: 1,
          weight: 1,
          value: 10,
          hs_tariff: '',
          origin_country: 'US',
        }
      ],
      contents_type: 'merchandise',
      customs_signer: '',
      non_delivery_option: 'return',
      eel_pfc: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = form.watch('items');
  const totalValue = watchedItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  // Auto-set EEL/PFC based on total value
  React.useEffect(() => {
    if (totalValue < 2500) {
      form.setValue('eel_pfc', 'NOEEI 30.37(a)');
    } else {
      form.setValue('eel_pfc', '');
    }
  }, [totalValue, form]);

  const handleSubmit = async (values: CustomsFormValues) => {
    setIsSubmitting(true);
    try {
      const customsData = {
        customs_items: values.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          value: item.value,
          hs_tariff_number: item.hs_tariff || undefined,
          origin_country: item.origin_country,
        })),
        contents_type: values.contents_type,
        customs_signer: values.customs_signer,
        non_delivery_option: values.non_delivery_option,
        eel_pfc: values.eel_pfc || undefined,
        customs_certify: true,
      };

      onSubmit(customsData);
      toast.success('Customs documentation completed');
      onClose();
    } catch (error) {
      console.error('Error submitting customs data:', error);
      toast.error('Failed to submit customs documentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      weight: 1,
      value: 10,
      hs_tariff: '',
      origin_country: 'US',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            International Shipping - Customs Documentation
          </DialogTitle>
          <p className="text-muted-foreground">
            Complete the customs information for your international shipment
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Customs Items</h3>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Cotton T-shirt" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (oz) *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.1" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value (USD) *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.01" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.hs_tariff`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HS Tariff (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 6109.10.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.origin_country`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country of Origin *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <div className="text-right font-medium">
                Total Value: ${totalValue.toFixed(2)} USD
              </div>
            </div>

            {/* Customs Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contents_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contents Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gift">Gift</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customs_signer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customs Signer *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="non_delivery_option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Non-Delivery Option *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="return">Return to Sender</SelectItem>
                        <SelectItem value="abandon">Abandon Package</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eel_pfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EEL/PFC Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={totalValue < 2500 ? "Auto-filled for orders < $2,500" : "Enter AES ITN"} 
                        {...field} 
                        disabled={totalValue < 2500}
                      />
                    </FormControl>
                    <FormMessage />
                    {totalValue >= 2500 && (
                      <p className="text-sm text-amber-600">
                        For shipments ≥ $2,500, you must provide an AES ITN number
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Complete Customs Documentation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;