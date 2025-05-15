
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Upload, Truck, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from "sonner";
import { useShippingRates } from '@/hooks/useShippingRates';

interface InternationalShippingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InternationalShippingSheet: React.FC<InternationalShippingSheetProps> = ({
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
      toast.success("International shipping label created successfully!");
    } catch (error) {
      console.error("Error generating international label:", error);
      toast.error("Failed to create international shipping label");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] sm:w-[540px] md:w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-indigo-800 flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            International Shipping
          </SheetTitle>
          <SheetDescription>
            Send packages worldwide with customs forms automatically generated.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <Card className="border border-indigo-100 shadow-md rounded-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
              <h2 className="text-lg font-semibold text-indigo-800 flex items-center mb-2">
                <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                International Shipping
              </h2>
              <p className="text-indigo-700 text-sm">Send packages worldwide with customs forms automatically generated.</p>
            </div>

            <div className="p-6">
              <div className="flex justify-center items-center py-4 px-4">
                <div className="text-center max-w-md">
                  <Globe className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">International Shipping</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Ship to over 200+ countries with our international shipping service, including automated customs documentation.
                  </p>
                  <Link to="/international">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Go to International Shipping
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6 border-t pt-6 border-gray-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Quick International Options</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    className="border-indigo-200 hover:bg-indigo-50 flex items-center justify-center h-auto py-3"
                    onClick={handleLabelGeneration}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Truck className="h-5 w-5 mb-2 text-indigo-600" />
                      <span className="font-medium">Generate Sample Label</span>
                      <span className="text-xs text-gray-500 mt-1">Create test international label</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-indigo-200 hover:bg-indigo-50 flex items-center justify-center h-auto py-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Calculator className="h-5 w-5 mb-2 text-indigo-600" />
                      <span className="font-medium">International Rates</span>
                      <span className="text-xs text-gray-500 mt-1">Compare shipping costs</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="border-indigo-200 hover:bg-indigo-50 flex items-center justify-center h-auto py-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <Upload className="h-5 w-5 mb-2 text-indigo-600" />
                      <span className="font-medium">Bulk International</span>
                      <span className="text-xs text-gray-500 mt-1">Upload multiple international shipments</span>
                    </div>
                  </Button>
                  
                  <Link to="/international" className="w-full">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center h-auto py-3"
                    >
                      <div className="flex flex-col items-center text-center">
                        <Globe className="h-5 w-5 mb-2" />
                        <span className="font-medium">Full International</span>
                        <span className="text-xs text-gray-300 mt-1">Access all international features</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-6 border-gray-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Popular Destinations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["Canada", "United Kingdom", "Australia", "Germany", "Japan", "Mexico"].map((country) => (
                    <Button 
                      key={country} 
                      variant="outline"
                      className="border-indigo-100 hover:bg-indigo-50 text-indigo-700"
                    >
                      {country}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 text-center text-sm text-indigo-700">
              <p>All international shipments include customs documentation and tracking</p>
            </div>
          </Card>
          
          {/* Additional international shipping info */}
          <Card className="border border-indigo-100 shadow-sm">
            <div className="p-4">
              <h3 className="font-medium text-indigo-800 mb-2">International Shipping Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Ensure complete and accurate customs information</li>
                <li>Include correct harmonization codes for your items</li>
                <li>Verify recipient's address and contact information</li>
                <li>Check destination country import restrictions</li>
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
          <Link to="/international">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Full International Shipping
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InternationalShippingSheet;
