
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ onDownloadTemplate }) => {
  const handleDownloadEnhancedTemplate = () => {
    // Enhanced CSV template with carrier options
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight,preferred_carrier,preferred_service,package_type,delivery_confirmation,insurance_value',
      'John Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16,USPS,Priority,box,signature_required,100',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8,UPS,Ground,envelope,delivery_confirmation,50',
      'Bob Johnson,Global LLC,789 Pine St,,New York,NY,10001,US,5555551234,15,10,6,25,FedEx,Express,box,signature_required,200'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'enhanced_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Bulk Shipping Upload</h1>
          <p className="text-gray-600">Upload a CSV file to process multiple shipments with live carrier rates</p>
        </div>
        
        <div className="flex gap-2 mt-4 lg:mt-0">
          <Button 
            variant="outline" 
            onClick={onDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Basic Template
          </Button>
          
          <Button 
            onClick={handleDownloadEnhancedTemplate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Enhanced Template
          </Button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Enhanced Template Features:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Carrier Selection:</strong> USPS, UPS, FedEx, DHL options</li>
          <li>• <strong>Service Types:</strong> Ground, Express, Priority, Overnight</li>
          <li>• <strong>Package Types:</strong> Box, Envelope, Tube, Pak</li>
          <li>• <strong>Delivery Options:</strong> Signature required, Delivery confirmation</li>
          <li>• <strong>Insurance:</strong> Optional insurance value</li>
          <li>• <strong>Live Rates:</strong> Real-time pricing from carrier APIs</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadHeader;
