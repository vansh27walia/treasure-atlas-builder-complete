
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Upload, Truck, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { useShippingRates } from '@/hooks/useShippingRates';

interface ShippingToSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShippingToSheet: React.FC<ShippingToSheetProps> = ({
  open,
  onOpenChange
}) => {
  const {
    rates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    shipmentId,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
  } = useShippingRates();

  const handleLabelGeneration = async () => {
    try {
      await handleCreateLabel();
      toast.success("Shipping To label created successfully!");
    } catch (error) {
      console.error("Error generating shipping to label:", error);
      toast.error("Failed to create Shipping To label");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] sm:w-[540px] md:w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-blue-800 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Shipping To
          </SheetTitle>
          <SheetDescription>
            Send packages to specific destinations with automated shipping procedures.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <Card className="border border-blue-100 shadow-md rounded-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Shipping To
              </h2>
              <p className="text-blue-700 text-sm">Send packages to specific destinations with automated documentation.</p>
            </div>

            <div className="p-6">
              <div className="flex justify-center items-center py-4 px-4">
                <div className="text-center max-w-md">
                  <Truck className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Shipping To</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Ship to specific destinations with our shipping service, including automated shipping documentation.
                  </p>
                  <Link to="/shipping-to">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Go to Shipping To
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6 border-t pt-6 border-gray-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Shipping Options</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    className="border-blue-200 hover:bg-blue-50 flex items-center justify-center h-auto py-3"
                    onClick={handleLabelGeneration}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Truck className="h-5 w-5 mb-2 text-blue-600" />
                      <span className="font-medium">Generate Sample Label</span>
                      <span className="text-xs text-gray-500 mt-1">Create test shipping label</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-blue-200 hover:bg-blue-50 flex items-center justify-center h-auto py-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Calculator className="h-5 w-5 mb-2 text-blue-600" />
                      <span className="font-medium">Shipping Rates</span>
                      <span className="text-xs text-gray-500 mt-1">Compare shipping costs</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-blue-200 hover:bg-blue-50 flex items-center justify-center h-auto py-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Upload className="h-5 w-5 mb-2 text-blue-600" />
                      <span className="font-medium">Bulk Shipping</span>
                      <span className="text-xs text-gray-500 mt-1">Upload multiple shipments</span>
                    </div>
                  </Button>
                  
                  <Link to="/shipping-to" className="w-full">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center h-auto py-3"
                    >
                      <div className="flex flex-col items-center text-center">
                        <Truck className="h-5 w-5 mb-2" />
                        <span className="font-medium">Full Shipping Features</span>
                        <span className="text-xs text-gray-300 mt-1">Access all shipping features</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-6 border-gray-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Popular Destinations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["New York", "Los Angeles", "Chicago", "Dallas", "Miami", "Seattle"].map((city) => (
                    <Button 
                      key={city} 
                      variant="outline"
                      className="border-blue-100 hover:bg-blue-50 text-blue-700"
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 text-center text-sm text-blue-700">
              <p>All shipments include shipping documentation and tracking</p>
            </div>
          </Card>
          
          {/* Additional shipping info */}
          <Card className="border border-blue-100 shadow-sm">
            <div className="p-4">
              <h3 className="font-medium text-blue-800 mb-2">Shipping Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Double check the receiving address to ensure accuracy</li>
                <li>Choose the right packaging for your items</li>
                <li>Consider insurance for valuable items</li>
                <li>Include all necessary documentation for smooth delivery</li>
              </ul>
            </div>
          </Card>
        </div>
        
        {/* Actions area */}
        <div className="mt-8 flex justify-end gap-3">
          <Button 
            variant="outline" 
            className="border-gray-300" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Link to="/shipping-to">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Full Shipping Features
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShippingToSheet;
