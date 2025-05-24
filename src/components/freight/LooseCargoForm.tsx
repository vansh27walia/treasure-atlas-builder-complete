
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { LooseCargoLoad } from '@/types/freight';

interface LooseCargoFormProps {
  loads: any[];
  onChange: (loads: LooseCargoLoad[]) => void;
}

const LooseCargoForm: React.FC<LooseCargoFormProps> = ({ loads, onChange }) => {
  const [calculateBy, setCalculateBy] = useState<'unit' | 'total'>('unit');

  const addLoad = () => {
    const newLoad: LooseCargoLoad = {
      id: Date.now().toString(),
      calculateBy,
      unitType: calculateBy === 'unit' ? 'pallets' : undefined,
      quantity: 1,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm'
      },
      weight: {
        value: 0,
        unit: 'kg'
      }
    };

    onChange([...loads, newLoad]);
  };

  const updateLoad = (id: string, updates: Partial<LooseCargoLoad>) => {
    onChange(loads.map(load => 
      load.id === id ? { ...load, ...updates } : load
    ));
  };

  const removeLoad = (id: string) => {
    onChange(loads.filter(load => load.id !== id));
  };

  const renderUnitCalculation = (load: LooseCargoLoad, index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Unit Type *</Label>
          <Select
            value={load.unitType}
            onValueChange={(value) => updateLoad(load.id, { unitType: value as 'pallets' | 'boxes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pallets">Pallets</SelectItem>
              <SelectItem value="boxes">Boxes & Crates</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Quantity *</Label>
          <Input
            type="number"
            min="1"
            value={load.quantity}
            onChange={(e) => updateLoad(load.id, { quantity: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Length *</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={load.dimensions.length}
            onChange={(e) => updateLoad(load.id, {
              dimensions: { ...load.dimensions, length: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Width *</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={load.dimensions.width}
            onChange={(e) => updateLoad(load.id, {
              dimensions: { ...load.dimensions, width: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Height *</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={load.dimensions.height}
            onChange={(e) => updateLoad(load.id, {
              dimensions: { ...load.dimensions, height: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Select
            value={load.dimensions.unit}
            onValueChange={(value) => updateLoad(load.id, {
              dimensions: { ...load.dimensions, unit: value as 'cm' | 'in' }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="in">in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Weight *</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={load.weight.value}
            onChange={(e) => updateLoad(load.id, {
              weight: { ...load.weight, value: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Weight Unit</Label>
          <Select
            value={load.weight.unit}
            onValueChange={(value) => updateLoad(load.id, {
              weight: { ...load.weight, unit: value as 'kg' | 'lbs' }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lbs">lbs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderTotalCalculation = (load: LooseCargoLoad, index: number) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Total Volume *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={load.totalVolume || 0}
            onChange={(e) => updateLoad(load.id, { totalVolume: parseFloat(e.target.value) || 0 })}
            placeholder="cubic meters"
          />
        </div>
        <div>
          <Label>Total Weight *</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={load.weight.value}
            onChange={(e) => updateLoad(load.id, {
              weight: { ...load.weight, value: parseFloat(e.target.value) || 0 }
            })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Label>Calculate by *</Label>
        <Select
          value={calculateBy}
          onValueChange={(value) => {
            setCalculateBy(value as 'unit' | 'total');
            // Reset loads when changing calculation method
            onChange([]);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unit">Unit Type (Pallets/Boxes & Crates)</SelectItem>
            <SelectItem value="total">Total Shipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loads.map((load, index) => (
        <Card key={load.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Load {index + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeLoad(load.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {calculateBy === 'unit' 
              ? renderUnitCalculation(load, index)
              : renderTotalCalculation(load, index)
            }
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addLoad}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Load
      </Button>
    </div>
  );
};

export default LooseCargoForm;
