
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FileText, Package } from 'lucide-react';
import { CustomsInfo, CustomsItem } from '@/types/shipping';

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customs: CustomsInfo) => void;
  fromCountry: string;
  toCountry: string;
  initialData?: CustomsInfo;
}

const CustomsDocumentationModal: React.FC<CustomsDocumentationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fromCountry,
  toCountry,
  initialData
}) => {
  const [customsData, setCustomsData] = useState<CustomsInfo>({
    contents_type: 'merchandise',
    contents_explanation: '',
    customs_certify: true,
    customs_signer: '',
    non_delivery_option: 'return',
    restriction_type: 'none',
    restriction_comments: '',
    customs_items: [{
      description: '',
      quantity: 1,
      value: 0,
      weight: 0,
      hs_tariff_number: '',
      origin_country: fromCountry || 'US'
    }],
    eel_pfc: ''
  });

  // Initialize with existing data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setCustomsData(initialData);
    } else if (isOpen && !initialData) {
      // Reset to default when opening without initial data
      setCustomsData({
        contents_type: 'merchandise',
        contents_explanation: '',
        customs_certify: true,
        customs_signer: '',
        non_delivery_option: 'return',
        restriction_type: 'none',
        restriction_comments: '',
        customs_items: [{
          description: '',
          quantity: 1,
          value: 0,
          weight: 0,
          hs_tariff_number: '',
          origin_country: fromCountry || 'US'
        }],
        eel_pfc: ''
      });
    }
  }, [isOpen, initialData, fromCountry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate required fields
    if (!customsData.customs_signer?.trim()) {
      alert('Please enter the customs signer name');
      return;
    }

    if (customsData.customs_items.some(item => !item.description.trim() || item.value <= 0)) {
      alert('Please fill in all item descriptions and values');
      return;
    }

    console.log('Submitting customs data:', customsData);
    onSubmit(customsData);
    
    // Close modal after successful submission
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleCancel = () => {
    console.log('Canceling customs modal');
    onClose();
  };

  const addCustomsItem = () => {
    setCustomsData(prev => ({
      ...prev,
      customs_items: [...prev.customs_items, {
        description: '',
        quantity: 1,
        value: 0,
        weight: 0,
        hs_tariff_number: '',
        origin_country: fromCountry || 'US'
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Customs Documentation</DialogTitle>
              <p className="text-sm text-gray-600">International shipping from {fromCountry} to {toCountry}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contents Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contents Type</Label>
              <Select 
                value={customsData.contents_type || 'merchandise'} 
                onValueChange={(value: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other') => 
                  setCustomsData(prev => ({ ...prev, contents_type: value }))
                }
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
              <Label className="text-sm font-medium">Non-Delivery Option</Label>
              <Select 
                value={customsData.non_delivery_option || 'return'} 
                onValueChange={(value: 'return' | 'abandon') => 
                  setCustomsData(prev => ({ ...prev, non_delivery_option: value }))
                }
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
          </div>

          {/* Contents Explanation */}
          {customsData.contents_type === 'other' && (
            <div>
              <Label className="text-sm font-medium">Contents Explanation</Label>
              <Input
                value={customsData.contents_explanation || ''}
                onChange={(e) => setCustomsData(prev => ({ ...prev, contents_explanation: e.target.value }))}
                placeholder="Explain the contents"
              />
            </div>
          )}

          {/* Customs Signer */}
          <div>
            <Label className="text-sm font-medium">Customs Signer *</Label>
            <Input
              value={customsData.customs_signer || ''}
              onChange={(e) => setCustomsData(prev => ({ ...prev, customs_signer: e.target.value }))}
              placeholder="Full name of person signing customs declaration"
              required
            />
          </div>

          {/* Customs Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Customs Items
              </Label>
              <Button type="button" onClick={addCustomsItem} variant="outline" size="sm">
                Add Item
              </Button>
            </div>

            {customsData.customs_items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {customsData.customs_items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeCustomsItem(index)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">HS Tariff Number</Label>
                    <Input
                      value={item.hs_tariff_number || ''}
                      onChange={(e) => updateCustomsItem(index, 'hs_tariff_number', e.target.value)}
                      placeholder="Optional tariff code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Value (USD) *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.value}
                      onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Weight (oz)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.weight}
                      onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Customs Documentation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
