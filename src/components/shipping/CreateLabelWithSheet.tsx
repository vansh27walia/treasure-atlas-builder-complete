
import React from 'react';
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { InternationalShippingSheet } from './InternationalShippingSheet';
import { Card } from '@/components/ui/card';

interface CreateLabelWithSheetProps {
  title?: string;
}

export const CreateLabelWithSheet: React.FC<CreateLabelWithSheetProps> = ({
  title = "International Shipping"
}) => {
  return (
    <Card className="p-6 shadow-md rounded-xl border border-gray-200">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          
          <InternationalShippingSheet trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Package className="h-4 w-4 mr-2" />
              Open Shipping Tool
            </Button>
          }>
            {/* The iframe content is loaded directly in the Sheet component */}
          </InternationalShippingSheet>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Benefits of our International Shipping Tool</h4>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Real-time rates from multiple carriers</li>
            <li>Automated customs forms and documentation</li>
            <li>Tracking and delivery confirmation</li>
            <li>Discounted rates for international shipments</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default CreateLabelWithSheet;
