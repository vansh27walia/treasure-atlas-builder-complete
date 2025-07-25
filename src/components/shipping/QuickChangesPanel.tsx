
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sliders, Truck, Clock, DollarSign, Weight, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface QuickChangesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges: (changes: any) => void;
  currentRate?: any;
}

const QuickChangesPanel: React.FC<QuickChangesPanelProps> = ({
  isOpen,
  onClose,
  onApplyChanges,
  currentRate
}) => {
  const [changes, setChanges] = useState({
    carrierPreference: '',
    serviceType: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    priority: 'standard'
  });

  const handleInputChange = (field: string, value: string) => {
    setChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setChanges(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };

  const handleApplyChanges = () => {
    onApplyChanges(changes);
    toast.success('Changes applied successfully');
    onClose();
  };

  const handleQuickSelect = (type: 'fastest' | 'cheapest' | 'express') => {
    let newChanges = { ...changes };
    
    switch (type) {
      case 'fastest':
        newChanges.priority = 'express';
        newChanges.serviceType = 'express';
        break;
      case 'cheapest':
        newChanges.priority = 'standard';
        newChanges.serviceType = 'ground';
        break;
      case 'express':
        newChanges.priority = 'overnight';
        newChanges.serviceType = 'overnight';
        break;
    }
    
    setChanges(newChanges);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Quick Changes
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Rate Info */}
          {currentRate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-1">Current Selection</h4>
              <p className="text-sm text-blue-700">
                {currentRate.carrier} - {currentRate.service}
              </p>
              <p className="text-lg font-bold text-blue-800">
                ${parseFloat(currentRate.rate).toFixed(2)}
              </p>
            </div>
          )}

          {/* Quick Select Options */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickSelect('fastest')}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                Fastest
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickSelect('cheapest')}
                className="flex-1"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Cheapest
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickSelect('express')}
                className="flex-1"
              >
                <Truck className="w-4 h-4 mr-1" />
                Express
              </Button>
            </div>
          </div>

          {/* Carrier Preference */}
          <div className="space-y-2">
            <Label>Carrier Preference</Label>
            <Select value={changes.carrierPreference} onValueChange={(value) => handleInputChange('carrierPreference', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <Select value={changes.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ground">Ground</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight Adjustment */}
          <div className="space-y-2">
            <Label>Weight (lbs)</Label>
            <Input
              type="number"
              step="0.1"
              value={changes.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              placeholder="Enter weight"
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensions (inches)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                step="0.1"
                value={changes.dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="L"
              />
              <Input
                type="number"
                step="0.1"
                value={changes.dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="W"
              />
              <Input
                type="number"
                step="0.1"
                value={changes.dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="H"
              />
            </div>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select value={changes.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="overnight">Overnight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApplyChanges} className="flex-1">
              Apply Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickChangesPanel;
