
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ContainerLoad } from '@/types/freight';

interface ContainerFormProps {
  loads: any[];
  onChange: (loads: ContainerLoad[]) => void;
}

const containerSizes = [
  { value: '20ft', label: "20' Standard" },
  { value: '40ft', label: "40' Standard" },
  { value: '40ft-hc', label: "40' HC (High Cube)" },
  { value: '45ft-hc', label: "45' HC (High Cube)" }
];

const ContainerForm: React.FC<ContainerFormProps> = ({ loads, onChange }) => {
  const addLoad = () => {
    const newLoad: ContainerLoad = {
      id: Date.now().toString(),
      quantity: 1,
      containerSize: '20ft',
      isOverweight: false
    };

    onChange([...loads, newLoad]);
  };

  const updateLoad = (id: string, updates: Partial<ContainerLoad>) => {
    onChange(loads.map(load => 
      load.id === id ? { ...load, ...updates } : load
    ));
  };

  const removeLoad = (id: string) => {
    onChange(loads.filter(load => load.id !== id));
  };

  return (
    <div className="space-y-6">
      {loads.map((load, index) => (
        <Card key={load.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Container Load {index + 1}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Units *</Label>
                <Input
                  type="number"
                  min="1"
                  value={load.quantity}
                  onChange={(e) => updateLoad(load.id, { quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="flex items-center">
                  Container Size *
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex items-center">
                          <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>HC = High Cube (taller containers)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={load.containerSize}
                  onValueChange={(value) => updateLoad(load.id, { containerSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select container size" />
                  </SelectTrigger>
                  <SelectContent>
                    {containerSizes.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`overweight-${load.id}`}
                  checked={load.isOverweight}
                  onCheckedChange={(checked) => updateLoad(load.id, { isOverweight: !!checked })}
                />
                <Label htmlFor={`overweight-${load.id}`} className="text-sm">
                  Overweight container (requires special handling)
                </Label>
              </div>
            </div>
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

export default ContainerForm;
