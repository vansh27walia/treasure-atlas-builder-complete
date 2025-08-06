
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments: string;
  customs_items: CustomsItem[];
  phone_number: string;
}

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customsData: CustomsData) => void;
}

const CustomsDocumentationModal: React.FC<CustomsDocumentationModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [customsData, setCustomsData] = useState<CustomsData>({
    customs_certify: true,
    customs_signer: '',
    contents_type: 'merchandise',
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
      origin_country: 'US'
    }],
    phone_number: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customsData.customs_signer.trim()) {
      toast.error('Customs signer name is required');
      return;
    }
    
    if (!customsData.phone_number.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    // Validate customs items
    for (let i = 0; i < customsData.customs_items.length; i++) {
      const item = customsData.customs_items[i];
      if (!item.description.trim()) {
        toast.error(`Item ${i + 1}: Description is required`);
        return;
      }
      if (item.value <= 0) {
        toast.error(`Item ${i + 1}: Value must be greater than 0`);
        return;
      }
      if (item.weight <= 0) {
        toast.error(`Item ${i + 1}: Weight must be greater than 0`);
        return;
      }
    }
    
    onSubmit(customsData);
    onClose();
  };

  const addCustomsItem = () => {
    setCustomsData(prev => ({
      ...prev,
      customs_items: [...prev.customs_items, {
        description: '',
        quantity: 1,
        weight: 1,
        value: 1,
        hs_tariff_number: '',
        origin_country: 'US'
      }]
    }));
  };

  const removeCustomsItem = (index: number) => {
    if (customsData.customs_items.length > 1) {
      setCustomsData(prev => ({
        ...prev,
        customs_items: prev.customs_items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateCustomsItem = (index: number, field: keyof CustomsItem, value: any) => {
    setCustomsData(prev => ({
      ...prev,
      customs_items: prev.customs_items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>International Customs Documentation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customs Signer */}
          <div className="space-y-2">
            <Label htmlFor="customs_signer">Customs Signer Name *</Label>
            <Input
              id="customs_signer"
              value={customsData.customs_signer}
              onChange={(e) => setCustomsData(prev => ({ ...prev, customs_signer: e.target.value }))}
              placeholder="Full name of person signing customs declaration"
              required
            />
          </div>

          {/* Phone Number - NEW REQUIRED FIELD */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              type="tel"
              value={customsData.phone_number}
              onChange={(e) => setCustomsData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+14155552671"
              required
            />
            <p className="text-sm text-muted-foreground">
              Required for customs processing and carrier contact
            </p>
          </div>

          {/* Contents Type */}
          <div className="space-y-2">
            <Label htmlFor="contents_type">Contents Type</Label>
            <Select 
              value={customsData.contents_type} 
              onValueChange={(value) => setCustomsData(prev => ({ ...prev, contents_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="gift">Gift</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="returned_goods">Returned Goods</SelectItem>
                <SelectItem value="sample">Sample</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* EEL/PFC */}
          <div className="space-y-2">
            <Label htmlFor="eel_pfc">EEL/PFC Code</Label>
            <Input
              id="eel_pfc"
              value={customsData.eel_pfc}
              onChange={(e) => setCustomsData(prev => ({ ...prev, eel_pfc: e.target.value }))}
              placeholder="NOEEI 30.37(a)"
            />
          </div>

          {/* Non Delivery Option */}
          <div className="space-y-2">
            <Label htmlFor="non_delivery_option">Non-Delivery Option</Label>
            <Select 
              value={customsData.non_delivery_option} 
              onValueChange={(value) => setCustomsData(prev => ({ ...prev, non_delivery_option: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return to Sender</SelectItem>
                <SelectItem value="abandon">Abandon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Restriction Type */}
          <div className="space-y-2">
            <Label htmlFor="restriction_type">Restriction Type</Label>
            <Select 
              value={customsData.restriction_type} 
              onValueChange={(value) => setCustomsData(prev => ({ ...prev, restriction_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
                <SelectItem value="sanitary_phytosanitary_inspection">Sanitary/Phytosanitary Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Restriction Comments */}
          {customsData.restriction_type !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="restriction_comments">Restriction Comments</Label>
              <Textarea
                id="restriction_comments"
                value={customsData.restriction_comments}
                onChange={(e) => setCustomsData(prev => ({ ...prev, restriction_comments: e.target.value }))}
                placeholder="Describe any restrictions or special handling requirements"
              />
            </div>
          )}

          {/* Customs Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Customs Items</Label>
              <Button type="button" onClick={addCustomsItem} variant="outline" size="sm">
                Add Item
              </Button>
            </div>
            
            {customsData.customs_items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {customsData.customs_items.length > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => removeCustomsItem(index)}
                      variant="destructive" 
                      size="sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`description_${index}`}>Description *</Label>
                    <Input
                      id={`description_${index}`}
                      value={item.description}
                      onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`quantity_${index}`}>Quantity *</Label>
                    <Input
                      id={`quantity_${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`weight_${index}`}>Weight (grams) *</Label>
                    <Input
                      id={`weight_${index}`}
                      type="number"
                      min="1"
                      value={item.weight}
                      onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`value_${index}`}>Value (USD) *</Label>
                    <Input
                      id={`value_${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.value}
                      onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value) || 0.01)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`hs_tariff_number_${index}`}>HS Tariff Number</Label>
                    <Input
                      id={`hs_tariff_number_${index}`}
                      value={item.hs_tariff_number}
                      onChange={(e) => updateCustomsItem(index, 'hs_tariff_number', e.target.value)}
                      placeholder="Harmonized System code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`origin_country_${index}`}>Origin Country</Label>
                    <Select 
                      value={item.origin_country} 
                      onValueChange={(value) => updateCustomsItem(index, 'origin_country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="MX">Mexico</SelectItem>
                        <SelectItem value="CN">China</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="IT">Italy</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="KR">South Korea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customs Certification */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="customs_certify"
              checked={customsData.customs_certify}
              onCheckedChange={(checked) => setCustomsData(prev => ({ ...prev, customs_certify: checked as boolean }))}
            />
            <Label htmlFor="customs_certify">
              I certify that the information given is correct and that this shipment complies with all applicable laws and regulations.
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              Complete Customs Documentation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
