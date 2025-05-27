
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload } from 'lucide-react';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ onDownloadTemplate }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Bulk Shipping Upload</h1>
          <p className="text-gray-600">Upload a CSV file to process multiple shipments with live carrier rates</p>
        </div>
        
        <div className="flex gap-2 mt-4 lg:mt-0">
          <Button 
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-blue-800">Template Format Requirements:</h3>
          <Button 
            onClick={onDownloadTemplate}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-3 w-3" />
            Get Template
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">Required Fields:</h4>
            <ul className="space-y-1">
              <li>• <strong>name</strong> - Recipient full name</li>
              <li>• <strong>street1</strong> - Street address</li>
              <li>• <strong>city</strong> - City name</li>
              <li>• <strong>state</strong> - State abbreviation (CA, NY, etc.)</li>
              <li>• <strong>zip</strong> - ZIP code</li>
              <li>• <strong>country</strong> - Country code (US, CA, etc.)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Optional Fields:</h4>
            <ul className="space-y-1">
              <li>• <strong>company</strong> - Company name</li>
              <li>• <strong>street2</strong> - Apartment/Suite</li>
              <li>• <strong>phone</strong> - Phone number</li>
              <li>• <strong>parcel_length/width/height</strong> - Inches</li>
              <li>• <strong>parcel_weight</strong> - Pounds</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Important:</strong> Save as CSV format, use exact column names as shown in template, and ensure no empty rows.
        </div>
      </div>
    </div>
  );
};

export default BulkUploadHeader;
