
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const CSVTemplateDownloader: React.FC = () => {
  const downloadTemplate = () => {
    const csvContent = `to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference
John Smith,Acme Corp,123 Main St,Suite 100,New York,NY,10001,US,555-0123,john@acme.com,16,12,8,4,ORDER-001
Jane Doe,Tech Solutions,456 Oak Ave,,Los Angeles,CA,90210,US,555-0456,jane@tech.com,24,10,10,6,ORDER-002
Bob Johnson,Global Inc,789 Pine St,Floor 2,Chicago,IL,60601,US,555-0789,bob@global.com,8,8,6,4,ORDER-003`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'shipping_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV template downloaded successfully');
  };

  const getTemplateInfo = () => {
    return {
      filename: 'shipping_template.csv',
      description: 'Bulk shipping template with required fields',
      fields: [
        { name: 'to_name', description: 'Recipient full name', required: true },
        { name: 'to_company', description: 'Company name (optional)', required: false },
        { name: 'to_street1', description: 'Primary street address', required: true },
        { name: 'to_street2', description: 'Secondary address line (optional)', required: false },
        { name: 'to_city', description: 'City name', required: true },
        { name: 'to_state', description: 'State/Province code', required: true },
        { name: 'to_zip', description: 'ZIP/Postal code', required: true },
        { name: 'to_country', description: 'Country code (default: US)', required: true },
        { name: 'to_phone', description: 'Phone number (optional)', required: false },
        { name: 'to_email', description: 'Email address (optional)', required: false },
        { name: 'weight', description: 'Package weight in ounces', required: true },
        { name: 'length', description: 'Package length in inches', required: true },
        { name: 'width', description: 'Package width in inches', required: true },
        { name: 'height', description: 'Package height in inches', required: true },
        { name: 'reference', description: 'Order/Reference number (optional)', required: false }
      ]
    };
  };

  const templateInfo = getTemplateInfo();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Template
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>{templateInfo.filename}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Template Fields Guide
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {templateInfo.fields.map((field) => (
            <div key={field.name} className="flex justify-between items-center py-1">
              <span className={`font-mono ${field.required ? 'font-semibold' : 'text-gray-600'}`}>
                {field.name}
              </span>
              <span className="text-gray-500 text-right max-w-xs">
                {field.description}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 border-t pt-2">
          <p><span className="text-red-500">*</span> Required fields</p>
          <p>• Weight should be in ounces (oz)</p>
          <p>• Dimensions should be in inches</p>
          <p>• Use 2-letter state codes (NY, CA, TX, etc.)</p>
        </div>
      </div>
    </div>
  );
};

export default CSVTemplateDownloader;
