
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, ArrowRight, Brain, Sparkles, MapPin, Package, User, Hash } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

interface FieldMapping {
  csvHeader: string;
  easypostField: string;
  required: boolean;
  category: 'address' | 'package' | 'reference';
  icon: React.ComponentType<any>;
}

const EASYPOST_FIELDS: FieldMapping[] = [
  { csvHeader: '', easypostField: 'to_name', required: true, category: 'address', icon: User },
  { csvHeader: '', easypostField: 'to_street1', required: true, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'to_street2', required: false, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'to_city', required: true, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'to_state', required: true, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'to_zip', required: true, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'to_country', required: true, category: 'address', icon: MapPin },
  { csvHeader: '', easypostField: 'weight', required: true, category: 'package', icon: Package },
  { csvHeader: '', easypostField: 'length', required: true, category: 'package', icon: Package },
  { csvHeader: '', easypostField: 'width', required: true, category: 'package', icon: Package },
  { csvHeader: '', easypostField: 'height', required: true, category: 'package', icon: Package },
  { csvHeader: '', easypostField: 'reference', required: false, category: 'reference', icon: Hash },
];

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({
  csvContent,
  onMappingComplete,
  onCancel
}) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMappingComplete, setAiMappingComplete] = useState(false);

  useEffect(() => {
    const lines = csvContent.split('\n');
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setCsvHeaders(headers);
      performAIMapping(headers);
    }
  }, [csvContent]);

  const performAIMapping = async (headers: string[]) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: { headers, targetFields: EASYPOST_FIELDS.map(f => f.easypostField) }
      });

      if (error) throw error;

      const aiMappings = EASYPOST_FIELDS.map(field => ({
        ...field,
        csvHeader: data.mappings[field.easypostField] || ''
      }));

      setMappings(aiMappings);
      setAiMappingComplete(true);
      toast.success('AI mapping completed! Review and adjust as needed.');
    } catch (error) {
      console.error('AI mapping error:', error);
      setMappings(EASYPOST_FIELDS.map(field => ({ ...field, csvHeader: '' })));
      toast.error('AI mapping failed. Please map headers manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (easypostField: string, csvHeader: string) => {
    setMappings(prev => prev.map(mapping => 
      mapping.easypostField === easypostField 
        ? { ...mapping, csvHeader }
        : mapping
    ));
  };

  const validateMappings = (): boolean => {
    const requiredFields = mappings.filter(m => m.required);
    const missingRequired = requiredFields.filter(m => !m.csvHeader);
    
    if (missingRequired.length > 0) {
      toast.error(`Please map required fields: ${missingRequired.map(m => m.easypostField).join(', ')}`);
      return false;
    }
    return true;
  };

  const convertCsv = () => {
    if (!validateMappings()) return;

    const lines = csvContent.split('\n');
    const dataRows = lines.slice(1);
    
    const easypostHeaders = EASYPOST_FIELDS.map(f => f.easypostField);
    const convertedLines = [easypostHeaders.join(',')];

    dataRows.forEach(row => {
      if (row.trim()) {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const convertedRow = easypostHeaders.map(easypostField => {
          const mapping = mappings.find(m => m.easypostField === easypostField);
          if (mapping && mapping.csvHeader) {
            const csvIndex = csvHeaders.indexOf(mapping.csvHeader);
            return csvIndex >= 0 ? values[csvIndex] || '' : '';
          }
          return easypostField === 'to_country' ? 'US' : '';
        });
        convertedLines.push(convertedRow.join(','));
      }
    });

    const convertedCsv = convertedLines.join('\n');
    onMappingComplete(convertedCsv);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'address': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'package': return 'bg-green-100 text-green-800 border-green-200';
      case 'reference': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full mb-6 shadow-2xl">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Header Mapping</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Our AI has analyzed your CSV headers. Review and adjust the mappings below to ensure perfect compatibility.
        </p>
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-semibold">AI is mapping your headers...</span>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center text-xl">
            <Sparkles className="w-6 h-6 mr-3" />
            Header Mapping Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {/* Vertical Layout for Field Mappings */}
          <div className="space-y-6">
            {['address', 'package', 'reference'].map(category => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize flex items-center">
                  {category === 'address' && <MapPin className="w-5 h-5 mr-2 text-blue-600" />}
                  {category === 'package' && <Package className="w-5 h-5 mr-2 text-green-600" />}
                  {category === 'reference' && <Hash className="w-5 h-5 mr-2 text-purple-600" />}
                  {category} Fields
                </h3>
                
                <div className="grid gap-4">
                  {mappings.filter(m => m.category === category).map((mapping) => {
                    const IconComponent = mapping.icon;
                    return (
                      <div 
                        key={mapping.easypostField} 
                        className="flex flex-col space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(mapping.category)}`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{mapping.easypostField}</span>
                                {mapping.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Map to your CSV column</p>
                            </div>
                          </div>
                          
                          {aiMappingComplete && mapping.csvHeader && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        
                        <Select
                          value={mapping.csvHeader}
                          onValueChange={(value) => handleMappingChange(mapping.easypostField, value)}
                        >
                          <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Select CSV column" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-50">
                            <SelectItem value="">
                              <span className="text-gray-500">No mapping</span>
                            </SelectItem>
                            {csvHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                <span className="font-medium">{header}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Alert className="mt-8 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Validation:</strong> Required fields must be mapped before proceeding. 
              Optional fields can be left unmapped if not available in your CSV.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="px-6 py-2"
            >
              Cancel
            </Button>
            
            <Button
              onClick={convertCsv}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue Processing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CsvHeaderMapper;
