
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface CsvHeaderMapperProps {
  headers: string[];
  suggestedMappings: Record<string, string>;
  onMappingChange: (mappings: Record<string, string>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({
  headers,
  suggestedMappings,
  onMappingChange,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>(suggestedMappings);
  const [autoMappingApplied, setAutoMappingApplied] = useState(false);

  // Standard field mappings for EasyPost
  const requiredFields = [
    { key: 'to_name', label: 'Recipient Name', required: true },
    { key: 'to_street1', label: 'Street Address', required: true },
    { key: 'to_city', label: 'City', required: true },
    { key: 'to_state', label: 'State/Province', required: true },
    { key: 'to_zip', label: 'ZIP/Postal Code', required: true },
    { key: 'to_country', label: 'Country', required: true },
    { key: 'weight', label: 'Weight (lbs)', required: true },
    { key: 'length', label: 'Length (inches)', required: true },
    { key: 'width', label: 'Width (inches)', required: true },
    { key: 'height', label: 'Height (inches)', required: true }
  ];

  const optionalFields = [
    { key: 'to_street2', label: 'Address Line 2', required: false },
    { key: 'to_company', label: 'Company', required: false },
    { key: 'to_phone', label: 'Phone Number', required: false },
    { key: 'reference', label: 'Reference/Order #', required: false },
    { key: 'customs_value', label: 'Customs Value', required: false },
    { key: 'customs_description', label: 'Customs Description', required: false }
  ];

  const allFields = [...requiredFields, ...optionalFields];

  useEffect(() => {
    setMappings(suggestedMappings);
    if (Object.keys(suggestedMappings).length > 0) {
      setAutoMappingApplied(true);
    }
  }, [suggestedMappings]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({
      ...prev,
      [field]: header === 'none' ? '' : header
    }));
  };

  const getUnmappedHeaders = () => {
    const mappedHeaders = Object.values(mappings).filter(Boolean);
    return headers.filter(header => !mappedHeaders.includes(header));
  };

  const getCompletionStatus = () => {
    const requiredMapped = requiredFields.filter(field => mappings[field.key]).length;
    const totalRequired = requiredFields.length;
    return { completed: requiredMapped, total: totalRequired };
  };

  const canProceed = () => {
    return requiredFields.every(field => mappings[field.key]);
  };

  const applyAutoMapping = () => {
    const autoMappings: Record<string, string> = {};
    
    // Simple keyword matching for auto-mapping
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to match common patterns
      if (lowerHeader.includes('name') && lowerHeader.includes('recipient')) {
        autoMappings['to_name'] = header;
      } else if (lowerHeader.includes('customername') || lowerHeader.includes('recipientname')) {
        autoMappings['to_name'] = header;
      } else if (lowerHeader.includes('address') && lowerHeader.includes('1')) {
        autoMappings['to_street1'] = header;
      } else if (lowerHeader.includes('street1') || lowerHeader.includes('address1')) {
        autoMappings['to_street1'] = header;
      } else if (lowerHeader.includes('city')) {
        autoMappings['to_city'] = header;
      } else if (lowerHeader.includes('state') || lowerHeader.includes('province')) {
        autoMappings['to_state'] = header;
      } else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) {
        autoMappings['to_zip'] = header;
      } else if (lowerHeader.includes('country')) {
        autoMappings['to_country'] = header;
      } else if (lowerHeader.includes('weight')) {
        autoMappings['weight'] = header;
      } else if (lowerHeader.includes('length')) {
        autoMappings['length'] = header;
      } else if (lowerHeader.includes('width')) {
        autoMappings['width'] = header;
      } else if (lowerHeader.includes('height')) {
        autoMappings['height'] = header;
      } else if (lowerHeader.includes('reference') || lowerHeader.includes('order')) {
        autoMappings['reference'] = header;
      }
    });
    
    setMappings(prev => ({ ...prev, ...autoMappings }));
    setAutoMappingApplied(true);
    toast.success('Auto-mapping applied! Please review and adjust as needed.');
  };

  const status = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-900">AI Column Mapping</h2>
        </div>
        <p className="text-lg text-gray-600 mb-6">
          Our AI has analyzed your CSV. Please review and confirm the field mappings below.
        </p>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            status.completed === status.total ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {status.completed === status.total ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-semibold">
              {status.completed}/{status.total} Required Fields Mapped
            </span>
          </div>
          
          {!autoMappingApplied && (
            <Button
              onClick={applyAutoMapping}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Auto-Mapping
            </Button>
          )}
        </div>
      </div>

      {/* VERTICAL Mapping Interface */}
      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {/* Required Fields */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Required Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredFields.map((field) => (
              <div key={field.key} className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900 flex items-center">
                      {field.label}
                      <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                    </label>
                    {mappings[field.key] && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  <Select
                    value={mappings[field.key] || 'none'}
                    onValueChange={(value) => handleMappingChange(field.key, value)}
                  >
                    <SelectTrigger className={`w-full ${mappings[field.key] ? 'border-green-300 bg-green-50' : 'border-red-300'}`}>
                      <SelectValue placeholder="Select a column from your CSV" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {getUnmappedHeaders().concat(mappings[field.key] ? [mappings[field.key]] : []).map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-blue-800 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Optional Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionalFields.map((field) => (
              <div key={field.key} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900 flex items-center">
                      {field.label}
                      <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                    </label>
                    {mappings[field.key] && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  <Select
                    value={mappings[field.key] || 'none'}
                    onValueChange={(value) => handleMappingChange(field.key, value)}
                  >
                    <SelectTrigger className={`w-full ${mappings[field.key] ? 'border-green-300 bg-green-50' : ''}`}>
                      <SelectValue placeholder="Select a column from your CSV" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Not Mapped --</SelectItem>
                      {getUnmappedHeaders().concat(mappings[field.key] ? [mappings[field.key]] : []).map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Unmapped Headers Warning */}
      {getUnmappedHeaders().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Unmapped Columns</h4>
            <p className="text-yellow-700 text-sm mb-3">
              These columns from your CSV won't be used:
            </p>
            <div className="flex flex-wrap gap-2">
              {getUnmappedHeaders().map((header) => (
                <Badge key={header} variant="outline" className="border-yellow-300 text-yellow-700">
                  {header}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="px-8"
        >
          Cancel
        </Button>
        
        <Button
          onClick={onConfirm}
          disabled={!canProceed() || isProcessing}
          size="lg"
          className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Confirm Mapping
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CsvHeaderMapper;
