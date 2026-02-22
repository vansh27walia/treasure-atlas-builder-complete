import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package, Ruler, Weight } from 'lucide-react';

export interface DimensionData {
  length: number;
  width: number;
  height: number;
  weight: number;
  weightUnit: 'lb' | 'kg';
  dimensionUnit: 'in' | 'cm';
}

interface DimensionModalProps {
  open: boolean;
  onClose: () => void;
  orderCount: number;
  /** Called with dimensions when user confirms */
  onConfirm: (dimensions: DimensionData, applyToAll: boolean) => void;
  /** Pre-filled weights per order (index → weight) */
  defaultWeights?: number[];
}

const DimensionModal: React.FC<DimensionModalProps> = ({
  open,
  onClose,
  orderCount,
  onConfirm,
  defaultWeights,
}) => {
  const [dimensions, setDimensions] = useState<DimensionData>({
    length: 12,
    width: 8,
    height: 6,
    weight: defaultWeights?.[0] || 1,
    weightUnit: 'lb',
    dimensionUnit: 'in',
  });
  const [applyToAll, setApplyToAll] = useState(true);

  const handleChange = (field: keyof DimensionData, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setDimensions(prev => ({ ...prev, [field]: num }));
    }
  };

  const handleConfirm = () => {
    if (dimensions.length <= 0 || dimensions.width <= 0 || dimensions.height <= 0) {
      return;
    }
    if (dimensions.weight <= 0) {
      return;
    }
    onConfirm(dimensions, applyToAll);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5 text-blue-600" />
            Add Package Dimensions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set dimensions for {orderCount} package{orderCount > 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Unit selectors */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Weight Unit</Label>
              <Select
                value={dimensions.weightUnit}
                onValueChange={(v) => setDimensions(prev => ({ ...prev, weightUnit: v as 'lb' | 'kg' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Dimension Unit</Label>
              <Select
                value={dimensions.dimensionUnit}
                onValueChange={(v) => setDimensions(prev => ({ ...prev, dimensionUnit: v as 'in' | 'cm' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensions grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="flex items-center gap-1 text-sm mb-1.5">
                <Ruler className="h-3.5 w-3.5" /> Length
              </Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={dimensions.length}
                onChange={(e) => handleChange('length', e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1 text-sm mb-1.5">
                <Ruler className="h-3.5 w-3.5" /> Width
              </Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={dimensions.width}
                onChange={(e) => handleChange('width', e.target.value)}
              />
            </div>
            <div>
              <Label className="flex items-center gap-1 text-sm mb-1.5">
                <Ruler className="h-3.5 w-3.5" /> Height
              </Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => handleChange('height', e.target.value)}
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <Label className="flex items-center gap-1 text-sm mb-1.5">
              <Weight className="h-3.5 w-3.5" /> Weight ({dimensions.weightUnit})
            </Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={dimensions.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
            />
          </div>

          {/* Apply to all toggle */}
          {orderCount > 1 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">Apply same dimensions to all {orderCount} packages</Label>
              <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>
            Confirm & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DimensionModal;
