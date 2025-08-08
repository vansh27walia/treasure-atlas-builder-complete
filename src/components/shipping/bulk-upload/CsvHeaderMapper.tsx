
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Brain, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CsvHeaderMapperProps {
  headers: string[];
  sampleData?: string[][];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onBack: () => void;
}

const REQUIRED_FIELDS = [
  { key: 'to_name', label: 'Recipient Name', required: true },
  { key: 'to_street1', label: 'Street Address', required: true },
  { key: 'to_city', label: 'City', required: true },
  { key: 'to_state', label: 'State/Province', required: true },
  { key: 'to_zip', label: 'ZIP/Postal Code', required: true },
  { key: 'to_country', label: 'Country', required: false },
  { key: 'weight', label: 'Weight', required: true },
  { key: 'length', label: 'Length', required: false },
  { key: 'width', label: 'Width', required: false },
  { key: 'height', label: 'Height', required: false },
  { key: 'to_street2', label: 'Street Address 2', required: false },
  { key: 'to_phone', label: 'Phone Number', required: false },
  { key: 'reference', label: 'Reference', required: false },
  { key: 'to_company', label: 'Company', required: false },
];

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({
  headers,
  sampleData,
  onMappingComplete,
  onBack
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiMappingFailed, setAiMappingFailed] = useState(false);
  const [useManualMapping, setUseManualMapping] = useState(false);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    // Try AI mapping first
    handleAIMapping();
  }, [headers]);

  const handleAIMapping = async () => {
    setIsLoadingAI(true);
    setAiMappingFailed(false);
    
    try {
      console.log('Attempting AI header mapping...');
      
      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: { 
          headers,
          sampleData: sampleData?.slice(0, 3) // Send first 3 rows for context
        }
      });

      if (error) {
        console.error('AI mapping error:', error);
        throw new Error('AI mapping failed');
      }

      if (data?.mappings) {
        console.log('AI mapping successful:', data);
        setAiSuggestions(data.mappings);
        setMapping(data.mappings);
        setConfidence(data.confidence || 'medium');
        
        // Check if all required fields are mapped
        const requiredFieldsMapped = REQUIRED_FIELDS
          .filter(field => field.required)
          .every(field => data.mappings[field.key]);
          
        if (requiredFieldsMapped && data.confidence === 'high') {
          toast.success('AI successfully mapped your CSV headers!');
        } else {
          toast.warning('AI mapping completed but may need manual review');
        }
      } else {
        throw new Error('No mapping suggestions received');
      }
    } catch (error) {
      console.error('AI mapping failed:', error);
      setAiMappingFailed(true);
      setUseManualMapping(true);
      toast.error('AI header mapping failed. Please map manually.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleManualMapping = (fieldKey: string, headerValue: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: headerValue
    }));
  };

  const handleSwitchToManual = () => {
    setUseManualMapping(true);
    setMapping({}); // Clear AI suggestions to start fresh
    toast.info('Switched to manual mapping mode');
  };

  const handleRetryAI = () => {
    setUseManualMapping(false);
    setAiMappingFailed(false);
    setMapping({});
    setAiSuggestions({});
    handleAIMapping();
  };

  const isValidMapping = () => {
    const requiredFields = REQUIRED_FIELDS.filter(field => field.required);
    return requiredFields.every(field => mapping[field.key] && mapping[field.key] !== '');
  };

  const handleComplete = () => {
    if (!isValidMapping()) {
      toast.error('Please map all required fields before continuing');
      return;
    }

    console.log('Final mapping:', mapping);
    onMappingComplete(mapping);
  };

  const getMappingStatus = (fieldKey: string, required: boolean) => {
    const isMapped = mapping[fieldKey] && mapping[fieldKey] !== '';
    const hasAiSuggestion = aiSuggestions[fieldKey] && !useManualMapping;
    
    if (isMapped) {
      return { status: 'mapped', color: 'text-green-600', icon: CheckCircle };
    } else if (required) {
      return { status: 'required', color: 'text-red-600', icon: AlertCircle };
    } else {
      return { status: 'optional', color: 'text-gray-400', icon: null };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {useManualMapping ? (
              <>
                <User className="h-6 w-6 text-blue-600" />
                Manual Header Mapping
              </>
            ) : (
              <>
                <Brain className="h-6 w-6 text-purple-600" />
                {isLoadingAI ? 'AI is mapping your headers...' : 'AI Header Mapping'}
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            {!useManualMapping && !isLoadingAI && (
              <div className="flex items-center gap-2">
                <Badge variant={confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'destructive'}>
                  {confidence.toUpperCase()} CONFIDENCE
                </Badge>
                {aiMappingFailed && (
                  <Badge variant="destructive">
                    AI FAILED
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex gap-2 ml-auto">
              {!useManualMapping && !isLoadingAI && (
                <Button variant="outline" onClick={handleSwitchToManual}>
                  Switch to Manual
                </Button>
              )}
              {useManualMapping && !isLoadingAI && (
                <Button variant="outline" onClick={handleRetryAI}>
                  Try AI Again
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoadingAI ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">AI is analyzing your CSV headers...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {REQUIRED_FIELDS.map(field => {
                const { status, color, icon: StatusIcon } = getMappingStatus(field.key, field.required);
                
                return (
                  <div key={field.key} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {StatusIcon && <StatusIcon className={`h-4 w-4 ${color}`} />}
                      <div>
                        <div className="font-medium">{field.label}</div>
                        {field.required && <div className="text-xs text-red-500">Required</div>}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <Select
                        value={mapping[field.key] || ''}
                        onValueChange={(value) => handleManualMapping(field.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CSV column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- None --</SelectItem>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {!useManualMapping && aiSuggestions[field.key] && (
                      <Badge variant="outline" className="text-xs">
                        AI Suggested
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      {sampleData && sampleData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    {headers.map(header => (
                      <th key={header} className="border border-gray-300 px-2 py-1 text-xs font-medium bg-gray-50">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 3).map((row, index) => (
                    <tr key={index}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-xs">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Upload
        </Button>
        
        <Button 
          onClick={handleComplete}
          disabled={!isValidMapping() || isLoadingAI}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue with Mapping
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default CsvHeaderMapper;
