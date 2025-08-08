
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

const requiredFields = [
  { key: 'to_name', label: 'Recipient Name', required: true },
  { key: 'to_street1', label: 'Street Address', required: true },
  { key: 'to_city', label: 'City', required: true },
  { key: 'to_state', label: 'State/Province', required: true },
  { key: 'to_zip', label: 'ZIP/Postal Code', required: true },
  { key: 'to_country', label: 'Country', required: false },
  { key: 'to_street2', label: 'Street Address 2', required: false },
  { key: 'to_company', label: 'Company', required: false },
  { key: 'to_phone', label: 'Phone', required: false },
  { key: 'weight', label: 'Weight (lbs)', required: true },
  { key: 'length', label: 'Length (in)', required: false },
  { key: 'width', label: 'Width (in)', required: false },
  { key: 'height', label: 'Height (in)', required: false },
  { key: 'reference', label: 'Reference/Order ID', required: false },
];

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({
  csvContent,
  onMappingComplete,
  onCancel,
}) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiAttempted, setAiAttempted] = useState(false);
  const [aiFailedAutoFallback, setAiFailedAutoFallback] = useState(false);

  // Parse CSV headers on mount
  useEffect(() => {
    if (csvContent) {
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setCsvHeaders(headers);
        
        // Auto-attempt AI mapping
        handleAIMapping(headers);
      }
    }
  }, [csvContent]);

  const handleAIMapping = async (headers: string[]) => {
    setIsLoadingAI(true);
    setAiAttempted(true);
    
    try {
      console.log('Attempting AI mapping for headers:', headers);
      
      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: { 
          csvContent,
          action: 'analyze'
        }
      });

      if (error) {
        console.error('AI mapping error:', error);
        setAiFailedAutoFallback(true);
        toast.error('AI mapping failed. Switched to manual mapping mode.');
        return;
      }

      if (data && data.suggestions && data.suggestions.mappings) {
        setMapping(data.suggestions.mappings);
        toast.success('AI successfully mapped your CSV headers!');
      } else {
        setAiFailedAutoFallback(true);
        toast.warning('AI could not map headers automatically. Please map manually.');
      }
    } catch (error) {
      console.error('AI mapping error:', error);
      setAiFailedAutoFallback(true);
      toast.error('AI mapping failed. Switched to manual mapping mode.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleManualMapping = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header === '' ? undefined : header
    }));
  };

  const handleComplete = async () => {
    // Validate required fields are mapped
    const missingRequired = requiredFields
      .filter(field => field.required && !mapping[field.key])
      .map(field => field.label);

    if (missingRequired.length > 0) {
      toast.error(`Please map required fields: ${missingRequired.join(', ')}`);
      return;
    }

    try {
      console.log('Converting CSV with mapping:', mapping);
      
      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: {
          csvContent,
          action: 'convert',
          mappings: mapping
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.convertedCSV) {
        onMappingComplete(data.convertedCSV);
      } else {
        throw new Error('No converted CSV received');
      }
    } catch (error) {
      console.error('CSV conversion error:', error);
      toast.error('Failed to convert CSV. Please check your mappings.');
    }
  };

  const getMappedCount = () => {
    return Object.keys(mapping).filter(key => mapping[key]).length;
  };

  const getRequiredMappedCount = () => {
    return requiredFields.filter(field => field.required && mapping[field.key]).length;
  };

  const getTotalRequired = () => {
    return requiredFields.filter(field => field.required).length;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {aiFailedAutoFallback ? (
            <User className="h-6 w-6 text-blue-600" />
          ) : (
            <Sparkles className="h-6 w-6 text-purple-600" />
          )}
          CSV Header Mapping
          {aiFailedAutoFallback && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              Manual Mode (AI Failed)
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {getMappedCount()} / {requiredFields.length} fields mapped
          </Badge>
          <Badge variant={getRequiredMappedCount() === getTotalRequired() ? 'default' : 'destructive'}>
            {getRequiredMappedCount()} / {getTotalRequired()} required fields
          </Badge>
        </div>
        {aiFailedAutoFallback && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              AI mapping failed automatically. Please map your CSV headers manually below.
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Loading State */}
        {isLoadingAI && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">AI is analyzing your CSV headers...</p>
          </div>
        )}

        {/* Manual Mapping Interface */}
        {(!isLoadingAI || aiFailedAutoFallback) && (
          <>
            <div className="grid gap-4">
              {requiredFields.map((field) => (
                <div key={field.key} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                      {mapping[field.key] && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Map this field to a column in your CSV
                    </p>
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
                        <SelectItem value="">-- No mapping --</SelectItem>
                        {csvHeaders.filter(header => header && header.trim() !== '').map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              
              <div className="flex gap-3">
                {!aiFailedAutoFallback && aiAttempted && (
                  <Button
                    variant="outline"
                    onClick={() => handleAIMapping(csvHeaders)}
                    disabled={isLoadingAI}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Try AI Again
                  </Button>
                )}
                
                <Button
                  onClick={handleComplete}
                  disabled={getRequiredMappedCount() < getTotalRequired()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Mapping
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CsvHeaderMapper;
