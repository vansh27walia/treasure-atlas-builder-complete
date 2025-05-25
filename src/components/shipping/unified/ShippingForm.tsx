
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, User, Phone, Mail, Calendar, FileText, Loader2 } from 'lucide-react';
import { ShipmentType, ShippingFormData } from '@/pages/UnifiedShippingPage';

const baseSchema = z.object({
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTimeWindow: z.string().default('8AM-5PM'),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryTimeWindow: z.string().default('8AM-5PM'),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Phone number is required"),
  contactEmail: z.string().email("Valid email is required"),
  insuranceRequired: z.boolean().default(false),
  specialInstructions: z.string().optional(),
});

const ltlSchema = baseSchema.extend({
  handlingUnits: z.coerce.number().min(1, "At least 1 handling unit required"),
  unitType: z.string().min(1, "Unit type is required"),
  weightPerUnit: z.coerce.number().min(1, "Weight per unit is required"),
  dimensionsPerUnit: z.object({
    length: z.coerce.number().min(1, "Length is required"),
    width: z.coerce.number().min(1, "Width is required"),
    height: z.coerce.number().min(1, "Height is required"),
  }),
  freightClass: z.string().min(1, "Freight class is required"),
  liftgateRequired: z.boolean().default(false),
  appointmentRequired: z.boolean().default(false),
});

const ftlSchema = baseSchema.extend({
  equipmentType: z.string().min(1, "Equipment type is required"),
  numberOfTrucks: z.coerce.number().min(1, "Number of trucks is required"),
  totalWeight: z.coerce.number().min(1, "Total weight is required"),
  totalDimensions: z.object({
    length: z.coerce.number().min(1, "Length is required"),
    width: z.coerce.number().min(1, "Width is required"),
    height: z.coerce.number().min(1, "Height is required"),
  }),
  accessorialServices: z.array(z.string()).default([]),
});

const heavyParcelSchema = baseSchema.extend({
  shipmentTitle: z.string().min(1, "Shipment title is required"),
  materialType: z.string().min(1, "Material type is required"),
  parcelCount: z.coerce.number().min(1, "Parcel count is required"),
  weightPerParcel: z.coerce.number().min(1, "Weight per parcel is required"),
  dimensionsPerParcel: z.object({
    length: z.coerce.number().min(1, "Length is required"),
    width: z.coerce.number().min(1, "Width is required"),
    height: z.coerce.number().min(1, "Height is required"),
  }),
  pickupPort: z.string().optional(),
  deliveryPort: z.string().optional(),
  specialHandlingNotes: z.string().optional(),
  additionalServices: z.array(z.string()).default([]),
});

interface ShippingFormProps {
  shipmentType: ShipmentType;
  onSubmit: (data: ShippingFormData) => Promise<void>;
  isLoading: boolean;
  testMode: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  shipmentType,
  onSubmit,
  isLoading,
  testMode
}) => {
  const getSchema = () => {
    switch (shipmentType) {
      case 'LTL': return ltlSchema;
      case 'FTL': return ftlSchema;
      case 'HEAVY_PARCEL': return heavyParcelSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      pickupAddress: '',
      deliveryAddress: '',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeWindow: '8AM-5PM',
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeWindow: '8AM-5PM',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      insuranceRequired: false,
      specialInstructions: '',
      // LTL defaults
      handlingUnits: 1,
      unitType: 'Pallet',
      weightPerUnit: 500,
      dimensionsPerUnit: { length: 48, width: 40, height: 48 },
      freightClass: '50',
      liftgateRequired: false,
      appointmentRequired: false,
      // FTL defaults
      equipmentType: 'Dry Van',
      numberOfTrucks: 1,
      totalWeight: 20000,
      totalDimensions: { length: 48, width: 8, height: 8 },
      accessorialServices: [],
      // Heavy Parcel defaults
      shipmentTitle: '',
      materialType: 'Machinery',
      parcelCount: 1,
      weightPerParcel: 1000,
      dimensionsPerParcel: { length: 48, width: 48, height: 48 },
      pickupPort: '',
      deliveryPort: '',
      specialHandlingNotes: '',
      additionalServices: [],
    }
  });

  const fillTestData = () => {
    form.reset({
      pickupAddress: '123 Main St, Los Angeles, CA 90210',
      deliveryAddress: '456 Oak Ave, New York, NY 10001',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTimeWindow: '8AM-12PM',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryTimeWindow: '1PM-5PM',
      contactName: 'John Doe',
      contactPhone: '(555) 123-4567',
      contactEmail: 'john.doe@example.com',
      insuranceRequired: true,
      specialInstructions: 'Handle with care - fragile items',
      ...form.getValues()
    });
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y divide-gray-200">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-blue-800">
                {shipmentType} Shipping Details
              </h2>
              {testMode && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={fillTestData}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Fill Test Data
                </Button>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Pickup & Delivery Locations
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter pickup address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pickupTimeWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="8AM-12PM">8AM - 12PM</SelectItem>
                            <SelectItem value="1PM-5PM">1PM - 5PM</SelectItem>
                            <SelectItem value="8AM-5PM">8AM - 5PM</SelectItem>
                            <SelectItem value="Anytime">Anytime</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter delivery address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deliveryTimeWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="8AM-12PM">8AM - 12PM</SelectItem>
                            <SelectItem value="1PM-5PM">1PM - 5PM</SelectItem>
                            <SelectItem value="8AM-5PM">8AM - 5PM</SelectItem>
                            <SelectItem value="Anytime">Anytime</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
              <User className="mr-2 h-5 w-5" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="mr-1 h-4 w-4" />
                      Contact Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Phone className="mr-1 h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="mr-1 h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Shipment-specific fields */}
          {shipmentType === 'LTL' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-blue-700">LTL Shipment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="handlingUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Handling Units</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pallet">Pallet</SelectItem>
                              <SelectItem value="Crate">Crate</SelectItem>
                              <SelectItem value="Drum">Drum</SelectItem>
                              <SelectItem value="Bundle">Bundle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="weightPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight per Unit (lbs)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="freightClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Freight Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="50">Class 50</SelectItem>
                            <SelectItem value="55">Class 55</SelectItem>
                            <SelectItem value="60">Class 60</SelectItem>
                            <SelectItem value="65">Class 65</SelectItem>
                            <SelectItem value="70">Class 70</SelectItem>
                            <SelectItem value="77.5">Class 77.5</SelectItem>
                            <SelectItem value="85">Class 85</SelectItem>
                            <SelectItem value="92.5">Class 92.5</SelectItem>
                            <SelectItem value="100">Class 100</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium mb-3 block">Dimensions per Unit (inches)</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="dimensionsPerUnit.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensionsPerUnit.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensionsPerUnit.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="liftgateRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Liftgate Required</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="appointmentRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Appointment Required</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {shipmentType === 'FTL' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-blue-700">Full Truckload Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="equipmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dry Van">Dry Van</SelectItem>
                            <SelectItem value="Flatbed">Flatbed</SelectItem>
                            <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                            <SelectItem value="Step Deck">Step Deck</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numberOfTrucks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Trucks</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium mb-3 block">Total Dimensions (feet)</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="totalDimensions.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalDimensions.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalDimensions.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shipmentType === 'HEAVY_PARCEL' && (
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-blue-700">Heavy Parcel Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="shipmentTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipment Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Industrial Equipment Shipment" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="materialType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Machinery">Machinery</SelectItem>
                            <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                            <SelectItem value="Bulk Goods">Bulk Goods</SelectItem>
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parcelCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcel Count</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weightPerParcel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight per Parcel (lbs)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium mb-3 block">Dimensions per Parcel (inches)</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="dimensionsPerParcel.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensionsPerParcel.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dimensionsPerParcel.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pickupPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Port (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Port of Los Angeles" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deliveryPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Port (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Port of New York" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Common Options */}
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-700 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Additional Options
            </h3>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="insuranceRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Insurance Required</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any special handling requirements or delivery instructions..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-center">
              <Button 
                type="submit" 
                size="lg" 
                className="min-w-64 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Getting {shipmentType} Rates...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3" />
                    Get {shipmentType} Rates
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default ShippingForm;
