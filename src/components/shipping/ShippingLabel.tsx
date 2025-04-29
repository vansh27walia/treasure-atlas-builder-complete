
import React from 'react';
import { Download } from 'lucide-react';

interface ShippingLabelProps {
  labelUrl: string;
  trackingCode: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ labelUrl, trackingCode }) => {
  if (!labelUrl) return null;
  
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="font-semibold text-green-800">Label Generated Successfully!</h3>
          <p className="text-sm text-green-700">Tracking Number: {trackingCode}</p>
        </div>
        <a 
          href={labelUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Download className="mr-2 h-4 w-4" /> Download Label
        </a>
      </div>
    </div>
  );
};

export default ShippingLabel;
