
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface CsvHeaderMapperProps {
  headers: string[];
  sampleData: Record<string, any>;
  onMappingComplete: (mapping: Record<string, string>) => void;
  isProcessing?: boolean;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({ 
  headers, 
  sampleData, 
  onMappingComplete,
  isProcessing = false
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isAIMapping, setIsAIMapping] = useState(false);
  const [aiMappingFailed, setAiMappingFailed] = useState(false);
  const [showManualMapping, setShowManualMapping] = useState(false);

  const expectedFields = [
    { key: 'recipient_name', label: 'Recipient Name', required: true },
    { key: 'recipient_company', label: 'Recipient Company', required: false },
    { key: 'recipient_street1', label: 'Street Address', required: true },
    { key: 'recipient_street2', label: 'Address Line 2', required: false },
    { key: 'recipient_city', label: 'City', required: true },
    { key: 'recipient_state', label: 'State', required: true },
    { key: 'recipient_zip', label: 'ZIP Code', required: true },
    { key: 'recipient_phone', label: 'Phone', required: false },
    { key: 'recipient_email', label: 'Email', required: false },
    { key: 'weight', label: 'Weight (lbs)', required: true },
  ];

  useEffect(() => {
    if (headers.length > 0 && !showManualMapping) {
      performAIMapping();
    }
  }, [headers]);

  const performAIMapping = async () => {
    setIsAIMapping(true);
    setAiMappingFailed(false);
    
    try {
      console.log('Attempting AI header mapping...');
      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: {
          csvHeaders: headers,
          sampleData: sampleData,
          expectedFields: expectedFields.map(f => ({ key: f.key, label: f.label, required: f.required }))
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.mapping) {
        console.log('AI mapping successful:', data.mapping);
        setMapping(data.mapping);
        toast.success('✨ AI successfully mapped CSV headers!');
      } else {
        throw new Error('AI mapping returned no results');
      }
    } catch (error) {
      console.error('AI mapping failed:', error);
      setAiMappingFailed(true);
      setShowManualMapping(true);
      toast.error('AI header mapping failed. Please map headers manually.');
    } finally {
      setIsAIMapping(false);
    }
  };

  const handleManualMapping = (csvHeader: string, expectedField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: expectedField
    }));
  };

  const handleRetryAI = () => {
    setShowManualMapping(false);
    setAiMappingFailed(false);
    performAIMapping();
  };

  const handleSwitchToManual = () => {
    setShowManualMapping(true);
    setIsAIMapping(false);
  };

  const validateMapping = () => {
    const requiredFields = expectedFields.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(mapping);
    const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
    
    return missingRequired;
  };

  const handleProceed = () => {
    const missingFields = validateMapping();
    if (missingFields.length > 0) {
      toast.error(`Please map all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    onMappingComplete(mapping);
  };

  if (isAIMapping) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
            AI Header Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">AI is analyzing your CSV headers...</p>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Our AI is intelligently mapping your CSV columns to the required shipping fields. This usually takes a few seconds.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {aiMappingFailed ? (
            <AlertCircle className="h-5 w-5 text-orange-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          CSV Header Mapping
          {!showManualMapping && Object.keys(mapping).length > 0 && (
            <Badge className="bg-green-100 text-green-800">
              ✨ AI Mapped
            </Badge>
          )}
          {showManualMapping && (
            <Badge className="bg-blue-100 text-blue-800">
              Manual Mode
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {aiMappingFailed && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <p className="font-medium text-orange-800">AI Mapping Failed</p>
            </div>
            <p className="text-sm text-orange-700 mb-3">
              The AI couldn't automatically map your CSV headers. Please use manual mapping below or retry AI mapping.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetryAI}>
                <Brain className="h-4 w-4 mr-1" />
                Retry AI Mapping
              </Button>
            </div>
          </div>
        )}

        {!showManualMapping && Object.keys(mapping).length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="font-medium text-green-800">AI Mapping Complete!</p>
              </div>
              <p className="text-sm text-green-700 mb-3">
                AI has successfully mapped your CSV headers. Review the mapping below and proceed, or switch to manual mapping if needed.
              </p>
              <Button variant="outline" size="sm" onClick={handleSwitchToManual}>
                Switch to Manual Mapping
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(mapping).map(([csvHeader, expectedField]) => {
                const field = expectedFields.find(f => f.key === expectedField);
                return (
                  <div key={csvHeader} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{csvHeader}</p>
                      <p className="text-xs text-gray-600">{sampleData[csvHeader]}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-green-700">{field?.label}</p>
                      {field?.required && (
                        <Badge size="sm" className="bg-red-100 text-red-800">Required</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showManualMapping && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Map each CSV column to the corresponding shipping field. Required fields must be mapped.
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">{header}</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Sample: {sampleData[header] || 'No data'}
                    </p>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  
                  <div className="flex-1">
                    <Select
                      value={mapping[header] || ''}
                      onValueChange={(value) => handleManualMapping(header, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Skip this column --</SelectItem>
                        {expectedFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label} {field.required && '(Required)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="text-sm text-gray-600">
            {validateMapping().length === 0 ? (
              <span className="text-green-600">✅ All required fields mapped</span>
            ) : (
              <span className="text-red-600">
                Missing required fields: {validateMapping().join(', ')}
              </span>
            )}
          </div>
          
          <Button 
            onClick={handleProceed} 
            disabled={validateMapping().length > 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed with Mapping'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvHeaderMapper;
