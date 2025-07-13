
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileText } from 'lucide-react';

export interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  hs_tariff_number?: string;
  origin_country?: string;
}

export interface CustomsInfo {
  eel_pfc: string;
  customs_certify: boolean;
  customs_signer: string;
  contents_type: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other';
  restriction_type: 'none' | 'other' | 'quarantine' | 'sanitary_phytosanitary_inspection';
  non_delivery_option: 'return' | 'abandon';
  customs_items: CustomsItem[];
}

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (customsInfo: CustomsInfo) => void;
  fromCountry: string;
  toCountry: string;
}

const CustomsDocumentationModal: React.FC<CustomsDocumentationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  fromCountry,
  toCountry,
}) => {
  const [customsItems, setCustomsItems] = useState<CustomsItem[]>([
    { description: '', quantity: 1, value: 0, weight: 0, hs_tariff_number: '', origin_country: fromCountry }
  ]);
  
  const [customsInfo, setCustomsInfo] = useState({
    eel_pfc: 'NOEEI 30.37(a)',
    customs_certify: true,
    customs_signer: '',
    contents_type: 'merchandise' as const,
    restriction_type: 'none' as const,
    non_delivery_option: 'return' as const,
  });

  const addCustomsItem = () => {
    setCustomsItems([...customsItems, {
      description: '',
      quantity: 1,
      value: 0,
      weight: 0,
      hs_tariff_number: '',
      origin_country: fromCountry
    }]);
  };

  const removeCustomsItem = (index: number) => {
    if (customsItems.length > 1) {
      setCustomsItems(customsItems.filter((_, i) => i !== index));
    }
  };

  const updateCustomsItem = (index: number, field: keyof CustomsItem, value: any) => {
    const updatedItems = [...customsItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setCustomsItems(updatedItems);
  };

  const handleComplete = () => {
    const totalValue = customsItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);
    
    const finalCustomsInfo: CustomsInfo = {
      ...customsInfo,
      eel_pfc: totalValue < 2500 ? 'NOEEI 30.37(a)' : customsInfo.eel_pfc,
      customs_items: customsItems,
    };

    onComplete(finalCustomsInfo);
  };

  const isFormValid = () => {
    return customsInfo.customs_signer.trim() !== '' && 
           customsItems.every(item => 
             item.description.trim() !== '' && 
             item.quantity > 0 && 
             item.value > 0 && 
             item.weight > 0
           );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-blue-600" />
            International Customs Documentation
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Shipping from {fromCountry} to {toCountry} requires customs documentation
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customs Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Package Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customsItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Item #{index + 1}</h4>
                    {customsItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomsItem(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                        placeholder="Detailed item description"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Value per Item (USD) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Weight per Item (oz) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>HS Tariff Number (optional)</Label>
                      <Input
                        value={item.hs_tariff_number || ''}
                        onChange={(e) => updateCustomsItem(index, 'hs_tariff_number', e.target.value)}
                        placeholder="e.g., 8517.12.00"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Country of Origin</Label>
                      <Input
                        value={item.origin_country || fromCountry}
                        onChange={(e) => updateCustomsItem(index, 'origin_country', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addCustomsItem}
                className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </CardContent>
          </Card>

          {/* Customs Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customs Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contents Type *</Label>
                  <Select 
                    value={customsInfo.contents_type} 
                    onValueChange={(value: any) => setCustomsInfo({...customsInfo, contents_type: value})}
                  >
                    <SelectTrigger className="mt-1">
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
                  <Label>Non-Delivery Option *</Label>
                  <Select 
                    value={customsInfo.non_delivery_option} 
                    onValueChange={(value: any) => setCustomsInfo({...customsInfo, non_delivery_option: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="return">Return to Sender</SelectItem>
                      <SelectItem value="abandon">Abandon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>Customs Signer *</Label>
                  <Input
                    value={customsInfo.customs_signer}
                    onChange={(e) => setCustomsInfo({...customsInfo, customs_signer: e.target.value})}
                    placeholder="Full name of person certifying contents"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={!isFormValid()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Complete Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
