
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface CustomsItem {
  description: string;
  quantity: number;
  weight: number;
  value: number;
  hsTariffNumber?: string;
  originCountry: string;
}

interface CustomsInfo {
  contentsType: 'gift' | 'merchandise' | 'documents' | 'returned_goods' | 'sample' | 'other';
  customsSigner: string;
  nonDeliveryOption: 'return' | 'abandon';
  eelPfc: string;
  customsItems: CustomsItem[];
}

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customsInfo: CustomsInfo) => void;
  fromCountry: string;
  toCountry: string;
}

const CustomsDocumentationModal: React.FC<CustomsDocumentationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fromCountry,
  toCountry
}) => {
  const [customsItems, setCustomsItems] = useState<CustomsItem[]>([
    { description: '', quantity: 1, weight: 0, value: 0, originCountry: fromCountry }
  ]);
  const [contentsType, setContentsType] = useState<CustomsInfo['contentsType']>('merchandise');
  const [customsSigner, setCustomsSigner] = useState('');
  const [nonDeliveryOption, setNonDeliveryOption] = useState<'return' | 'abandon'>('return');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValue = customsItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);
  const eelPfc = totalValue < 2500 ? 'NOEEI 30.37(a)' : '';

  const addItem = () => {
    setCustomsItems([...customsItems, { 
      description: '', 
      quantity: 1, 
      weight: 0, 
      value: 0, 
      originCountry: fromCountry 
    }]);
  };

  const removeItem = (index: number) => {
    if (customsItems.length > 1) {
      setCustomsItems(customsItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof CustomsItem, value: any) => {
    const updatedItems = [...customsItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setCustomsItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    const customsInfo: CustomsInfo = {
      contentsType,
      customsSigner,
      nonDeliveryOption,
      eelPfc: eelPfc || 'AES ITN Required',
      customsItems
    };
    
    try {
      await onSubmit(customsInfo);
      // Don't close here - let parent handle closing
    } catch (error) {
      console.error('Error submitting customs info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isSubmitting) {
      onClose();
    }
  };

  const isValid = customsItems.every(item => 
    item.description && item.quantity > 0 && item.value > 0
  ) && customsSigner.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !isSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            International Shipping - Customs Documentation
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Shipping from {fromCountry} to {toCountry} requires customs documentation
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customs Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Customs Items</Label>
              <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {customsItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {customsItems.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`description-${index}`}>Description *</Label>
                      <Input
                        id={`description-${index}`}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="e.g., Electronics, Clothing"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`weight-${index}`}>Weight (oz) *</Label>
                      <Input
                        id={`weight-${index}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => updateItem(index, 'weight', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`value-${index}`}>Value (USD) *</Label>
                      <Input
                        id={`value-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => updateItem(index, 'value', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`hs-${index}`}>HS Tariff Number</Label>
                      <Input
                        id={`hs-${index}`}
                        value={item.hsTariffNumber || ''}
                        onChange={(e) => updateItem(index, 'hsTariffNumber', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`origin-${index}`}>Origin Country</Label>
                      <Input
                        id={`origin-${index}`}
                        value={item.originCountry}
                        onChange={(e) => updateItem(index, 'originCountry', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contents Type */}
          <div>
            <Label htmlFor="contents-type">Contents Type *</Label>
            <Select value={contentsType} onValueChange={(value: any) => setContentsType(value)}>
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

          {/* Customs Signer */}
          <div>
            <Label htmlFor="customs-signer">Customs Signer *</Label>
            <Input
              id="customs-signer"
              value={customsSigner}
              onChange={(e) => setCustomsSigner(e.target.value)}
              placeholder="Full name of person certifying"
              required
            />
          </div>

          {/* Non-delivery Option */}
          <div>
            <Label htmlFor="non-delivery">Non-delivery Option</Label>
            <Select value={nonDeliveryOption} onValueChange={(value: any) => setNonDeliveryOption(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return to Sender</SelectItem>
                <SelectItem value="abandon">Abandon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* EEL/PFC Code */}
          <div>
            <Label>EEL/PFC Code</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Total declared value: ${totalValue.toFixed(2)}
              </p>
              <p className="text-sm text-blue-700">
                {totalValue < 2500 
                  ? `Automatically set to: ${eelPfc}`
                  : 'AES ITN required for shipments over $2,500'
                }
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              onClick={handleClose} 
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
