
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface InternationalShippingSheetProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export const InternationalShippingSheet: React.FC<InternationalShippingSheetProps> = ({
  children,
  trigger
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            International Shipping
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[90%] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-blue-800">International Shipping</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Ship internationally with confidence</h3>
            <p className="text-sm text-blue-700">
              Our international shipping service offers reliable delivery to 200+ countries with customs
              documentation, tracking, and competitive rates.
            </p>
          </div>
          
          <div className="space-y-4">
            <AspectRatio ratio={16/9} className="bg-muted rounded-md overflow-hidden">
              <iframe
                src="/international-shipping"
                className="h-full w-full border-0"
                title="International Shipping"
              />
            </AspectRatio>
            
            <div className="text-sm text-gray-500 mt-2">
              <p>Use our international shipping tool to get rates and create labels for packages worldwide.</p>
            </div>
          </div>
        </div>
        
        {children}
      </SheetContent>
    </Sheet>
  );
};

export default InternationalShippingSheet;
