
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Calculator } from 'lucide-react';
import RateCalculator from './RateCalculator';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullScreen?: boolean;
}

const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({ 
  isOpen, 
  onClose,
  fullScreen = false 
}) => {
  if (fullScreen) {
    // Full-screen version for the dedicated page
    return (
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Rate Calculator</h2>
                  <p className="text-sm text-gray-600">Get instant quotes from multiple carriers</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <RateCalculator />
          </div>
        </div>
      </div>
    );
  }

  // Modal version for pop-ups
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Rate Calculator</DialogTitle>
                <p className="text-sm text-gray-600">Compare shipping rates</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <RateCalculator />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateCalculatorModal;
