
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Globe, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface CustomsItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
  hs_tariff_number: string;
  origin_country: string;
}

interface CustomsData {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  contents_explanation?: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments: string;
  customs_items: CustomsItem[];
  phone_number: string;
  pickup_phone: string;
  delivery_phone: string;
}

interface CustomsInfoPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customsData: CustomsData) => void;
  fromCountry?: string;
  toCountry?: string;
  pickupAddress?: any;
  deliveryAddress?: any;
}

const CustomsInfoPopout: React.FC<CustomsInfoPopoutProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fromCountry,
  toCountry,
  pickupAddress,
  deliveryAddress
}) => {
  const [formData, setFormData] = useState<CustomsData>({
    customs_certify: true,
    customs_signer: '',
    contents_type: 'merchandise',
    contents_explanation: '',
    eel_pfc: 'NOEEI 30.37(a)',
    non_delivery_option: 'return',
    restriction_type: 'none',
    restriction_comments: '',
    customs_items: [{
      description: '',
      quantity: 1,
      weight: 1,
      value: 1,
      hs_tariff_number: '',
      origin_country: fromCountry || 'US'
    }],
    phone_number: pickupAddress?.phone || '',
    pickup_phone: pickupAddress?.phone || '',
    delivery_phone: deliveryAddress?.phone || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customs_signer.trim()) {
      toast.error('Customs signer name is required');
      return;
    }
    
    if (!formData.pickup_phone.trim()) {
      toast.error('Pickup phone number is required');
      return;
    }
    
    if (!formData.delivery_phone.trim()) {
      toast.error('Delivery phone number is required');
      return;
    }
    
    if (formData.customs_items.some(item => !item.description || !item.value || !item.weight)) {
      toast.error('All customs items must have description, value, and weight');
      return;
    }
    
    if (formData.contents_type === 'other' && !formData.contents_explanation?.trim()) {
      toast.error('Contents explanation is required when contents type is "other"');
      return;
    }
    
    if (formData.restriction_type !== 'none' && !formData.restriction_comments.trim()) {
      toast.error('Restriction comments are required when restriction type is not "none"');
      return;
    }

    onSubmit({
      ...formData,
      phone_number: formData.pickup_phone // Use pickup phone as primary phone
    });
  };

  const addCustomsItem = () => {
    setFormData({
      ...formData,
      customs_items: [...formData.customs_items, {
        description: '',
        quantity: 1,
        weight: 1,
        value: 1,
        hs_tariff_number: '',
        origin_country: fromCountry || 'US'
      }]
    });
  };

  const removeCustomsItem = (index: number) => {
    if (formData.customs_items.length > 1) {
      setFormData({
        ...formData,
        customs_items: formData.customs_items.filter((_, i) => i !== index)
      });
    }
  };

  const updateCustomsItem = (index: number, field: keyof CustomsItem, value: any) => {
    const updatedItems = formData.customs_items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, customs_items: updatedItems });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            International Customs Information
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Numbers Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Required Phone Numbers
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_phone">Pickup Phone Number *</Label>
                <Input
                  id="pickup_phone"
                  type="tel"
                  value={formData.pickup_phone}
                  onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                  placeholder="+1-555-123-4567"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="delivery_phone">Delivery Phone Number *</Label>
                <Input
                  id="delivery_phone"
                  type="tel"
                  value={formData.delivery_phone}
                  onChange={(e) => setFormData({ ...formData, delivery_phone: e.target.value })}
                  placeholder="+1-555-987-6543"
                  required
                />
              </div>
            </div>
          </div>

          {/* Customs Certification */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="customs_certify"
              checked={formData.customs_certify}
              onCheckedChange={(checked) => setFormData({ ...formData, customs_certify: !!checked })}
            />
            <Label htmlFor="customs_certify">I certify that the contents of this shipment are correct</Label>
          </div>

          <div>
            <Label htmlFor="customs_signer">Customs Signer Name *</Label>
            <Input
              id="customs_signer"
              value={formData.customs_signer}
              onChange={(e) => setFormData({ ...formData, customs_signer: e.target.value })}
              placeholder="Full name of person certifying"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contents_type">Contents Type *</Label>
              <Select
                value={formData.contents_type}
                onValueChange={(value) => setFormData({ ...formData, contents_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="gift">Gift</SelectItem>
                  <SelectItem value="returned_goods">Returned Goods</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eel_pfc">EEL/PFC *</Label>
              <Select
                value={formData.eel_pfc}
                onValueChange={(value) => setFormData({ ...formData, eel_pfc: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOEEI 30.37(a)">NOEEI 30.37(a)</SelectItem>
                  <SelectItem value="NOEEI 30.36">NOEEI 30.36</SelectItem>
                  <SelectItem value="AES ITN">AES ITN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.contents_type === 'other' && (
            <div>
              <Label htmlFor="contents_explanation">Contents Explanation *</Label>
              <Input
                id="contents_explanation"
                value={formData.contents_explanation}
                onChange={(e) => setFormData({ ...formData, contents_explanation: e.target.value })}
                placeholder="Explain what the package contains"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="non_delivery_option">Non-delivery Option *</Label>
              <Select
                value={formData.non_delivery_option}
                onValueChange={(value) => setFormData({ ...formData, non_delivery_option: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="abandon">Abandon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="restriction_type">Restriction Type *</Label>
              <Select
                value={formData.restriction_type}
                onValueChange={(value) => setFormData({ ...formData, restriction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="quantitative">Quantitative</SelectItem>
                  <SelectItem value="unconditional">Unconditional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.restriction_type !== 'none' && (
            <div>
              <Label htmlFor="restriction_comments">Restriction Comments *</Label>
              <Textarea
                id="restriction_comments"
                value={formData.restriction_comments}
                onChange={(e) => setFormData({ ...formData, restriction_comments: e.target.value })}
                placeholder="Describe the restrictions"
                required
              />
            </div>
          )}

          {/* Customs Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Customs Items</h3>
              <Button type="button" onClick={addCustomsItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {formData.customs_items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {formData.customs_items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeCustomsItem(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                      placeholder="e.g., Sneakers"
                      required
                    />
                  </div>

                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label>Value (USD) *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.value}
                      onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label>Weight (oz) *</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.weight}
                      onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label>Origin Country *</Label>
                    <Input
                      value={item.origin_country}
                      onChange={(e) => updateCustomsItem(index, 'origin_country', e.target.value)}
                      placeholder="US"
                      required
                    />
                  </div>

                  <div>
                    <Label>HS Tariff Number</Label>
                    <Input
                      value={item.hs_tariff_number}
                      onChange={(e) => updateCustomsItem(index, 'hs_tariff_number', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Complete Customs Documentation
            </Button>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsInfoPopout;
