
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, FileText, Package, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  hs_tariff_number?: string;
  origin_country: string;
}

interface CustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type?: string;
  restriction_comments?: string;
  customs_items: CustomsItem[];
  eel_pfc?: string;
}

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
    customs_certify: false,
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
    eel_pfc: 'NOEEI 30.37(a)'
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Initialize with existing data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setCustomsData(initialData);
    } else if (isOpen && !initialData) {
      setCustomsData({
        contents_type: 'merchandise',
        contents_explanation: '',
        customs_certify: false,
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
        eel_pfc: 'NOEEI 30.37(a)'
      });
    }
    setErrors([]);
  }, [isOpen, initialData, fromCountry]);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    if (!customsData.customs_signer.trim()) {
      validationErrors.push('Customs signer name is required');
    }

    if (!customsData.customs_certify) {
      validationErrors.push('You must certify the customs declaration');
    }

    customsData.customs_items.forEach((item, index) => {
      if (!item.description.trim()) {
        validationErrors.push(`Item ${index + 1}: Description is required`);
      }
      if (item.value <= 0) {
        validationErrors.push(`Item ${index + 1}: Value must be greater than 0`);
      }
      if (item.quantity <= 0) {
        validationErrors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });

    if (customsData.contents_type === 'other' && !customsData.contents_explanation?.trim()) {
      validationErrors.push('Contents explanation is required when "Other" is selected');
    }

    if (customsData.restriction_type !== 'none' && !customsData.restriction_comments?.trim()) {
      validationErrors.push('Restriction comments are required when restrictions are specified');
    }

    return validationErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log('Submitting customs data:', customsData);
    onSubmit(customsData);
    setErrors([]);
  };

  const handleCancel = () => {
    if (!customsData.customs_certify || !customsData.customs_signer.trim()) {
      alert('Customs clearance is required to proceed. Please fill out all required details.');
      return;
    }
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

        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contents Type and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contents Type *</Label>
              <Select 
                value={customsData.contents_type} 
                onValueChange={(value) => setCustomsData(prev => ({ ...prev, contents_type: value }))}
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
              <Label className="text-sm font-medium">Non-Delivery Option *</Label>
              <RadioGroup
                value={customsData.non_delivery_option}
                onValueChange={(value) => setCustomsData(prev => ({ ...prev, non_delivery_option: value }))}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="return" id="return" />
                  <Label htmlFor="return" className="text-sm">Return</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="abandon" id="abandon" />
                  <Label htmlFor="abandon" className="text-sm">Abandon</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Contents Explanation */}
          {customsData.contents_type === 'other' && (
            <div>
              <Label className="text-sm font-medium">Contents Explanation *</Label>
              <Input
                value={customsData.contents_explanation || ''}
                onChange={(e) => setCustomsData(prev => ({ ...prev, contents_explanation: e.target.value }))}
                placeholder="Explain the contents"
                className="mt-1"
              />
            </div>
          )}

          {/* Restriction Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Restriction Type</Label>
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
                </SelectContent>
              </Select>
            </div>

            {customsData.restriction_type !== 'none' && (
              <div>
                <Label className="text-sm font-medium">Restriction Comments *</Label>
                <Input
                  value={customsData.restriction_comments || ''}
                  onChange={(e) => setCustomsData(prev => ({ ...prev, restriction_comments: e.target.value }))}
                  placeholder="Describe restrictions"
                />
              </div>
            )}
          </div>

          {/* EEL/PFC */}
          <div>
            <Label className="text-sm font-medium">EEL/PFC</Label>
            <Input
              value={customsData.eel_pfc || ''}
              onChange={(e) => setCustomsData(prev => ({ ...prev, eel_pfc: e.target.value }))}
              placeholder="NOEEI 30.37(a)"
            />
          </div>

          {/* Customs Signer */}
          <div>
            <Label className="text-sm font-medium">Customs Signer *</Label>
            <Input
              value={customsData.customs_signer}
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
                Customs Items *
              </Label>
              <Button type="button" onClick={addCustomsItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
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
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
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
                    <Label className="text-sm">Weight (oz) *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.weight}
                      onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customs Certification */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="customs_certify"
              checked={customsData.customs_certify}
              onCheckedChange={(checked) => setCustomsData(prev => ({ ...prev, customs_certify: !!checked }))}
            />
            <Label htmlFor="customs_certify" className="text-sm">
              I certify that the information given above is correct and that this shipment does not contain any dangerous articles prohibited by law. *
            </Label>
          </div>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Submit & Continue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
