import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';

interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  origin_country: string;
}

interface CustomsDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
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
  const [items, setItems] = useState<CustomsItem[]>([
    { description: '', quantity: 1, value: 0, weight: 0, origin_country: fromCountry }
  ]);
  const [contentsType, setContentsType] = useState<string>('merchandise');
  const [restrictionType, setRestrictionType] = useState<string>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customsData = {
      contents_type: contentsType,
      contents_explanation: '',
      customs_certify: true,
      customs_signer: 'Shipper',
      non_delivery_option: 'return',
      restriction_type: restrictionType,
      restriction_comments: '',
      customs_items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        value: item.value,
        weight: item.weight,
        origin_country: item.origin_country,
        hs_tariff_number: '',
        code: 'other'
      }))
    };

    onSubmit(customsData);
    // Modal will be closed by parent component
  };

  const handleClose = () => {
    // Reset form state
    setItems([{ description: '', quantity: 1, value: 0, weight: 0, origin_country: fromCountry }]);
    setContentsType('merchandise');
    setRestrictionType('none');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            International Customs Documentation
          </DialogTitle>
          <DialogDescription>
            Required for shipments from {fromCountry} to {toCountry}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="contentsType" className="block text-sm font-medium text-gray-700">
              Contents Type
            </Label>
            <select
              id="contentsType"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={contentsType}
              onChange={(e) => setContentsType(e.target.value)}
            >
              <option value="merchandise">Merchandise</option>
              <option value="documents">Documents</option>
              <option value="gift">Gift</option>
              <option value="returned_goods">Returned Goods</option>
            </select>
          </div>

          <div>
            <Label htmlFor="restrictionType" className="block text-sm font-medium text-gray-700">
              Restriction Type
            </Label>
            <select
              id="restrictionType"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={restrictionType}
              onChange={(e) => setRestrictionType(e.target.value)}
            >
              <option value="none">None</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Customs Items</h4>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-6 gap-4">
                <div>
                  <Label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Input
                    type="text"
                    id={`description-${index}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, description: e.target.value };
                      setItems(newItems);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-gray-700">
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    id={`quantity-${index}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, quantity: parseInt(e.target.value) };
                      setItems(newItems);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`value-${index}`} className="block text-sm font-medium text-gray-700">
                    Value
                  </Label>
                  <Input
                    type="number"
                    id={`value-${index}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={item.value}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, value: parseFloat(e.target.value) };
                      setItems(newItems);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`weight-${index}`} className="block text-sm font-medium text-gray-700">
                    Weight
                  </Label>
                  <Input
                    type="number"
                    id={`weight-${index}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={item.weight}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, weight: parseFloat(e.target.value) };
                      setItems(newItems);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`origin_country-${index}`} className="block text-sm font-medium text-gray-700">
                    Origin Country
                  </Label>
                  <Input
                    type="text"
                    id={`origin_country-${index}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={item.origin_country}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, origin_country: e.target.value };
                      setItems(newItems);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const newItems = [...items];
                      newItems.splice(index, 1);
                      setItems(newItems);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setItems([
                  ...items,
                  { description: '', quantity: 1, value: 0, weight: 0, origin_country: fromCountry }
                ]);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Complete Customs Documentation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsDocumentationModal;
