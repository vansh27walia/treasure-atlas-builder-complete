
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Download, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface HeaderMapping {
  [detectedHeader: string]: string;
}

interface AnalysisResult {
  detectedHeaders: string[];
  suggestions: {
    mappings: HeaderMapping;
    unmapped: string[];
    missing_required: string[];
    confidence: string;
  };
  requiredHeaders: string[];
  optionalHeaders: string[];
}

interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({
  csvContent,
  onMappingComplete,
  onCancel
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [userMappings, setUserMappings] = useState<HeaderMapping>({});
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    analyzeHeaders();
  }, [csvContent]);

  const analyzeHeaders = async () => {
    try {
      setIsAnalyzing(true);
      console.log('Analyzing CSV headers...');

      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: {
          csvContent,
          action: 'analyze'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setAnalysis(data);
      setUserMappings(data.suggestions.mappings);
      console.log('Header analysis complete:', data);

    } catch (error) {
      console.error('Error analyzing headers:', error);
      toast.error('Failed to analyze CSV headers: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMappingChange = (detectedHeader: string, templateHeader: string) => {
    setUserMappings(prev => ({
      ...prev,
      [detectedHeader]: templateHeader
    }));
  };

  const removeMappingForTemplate = (templateHeader: string) => {
    setUserMappings(prev => {
      const newMappings = { ...prev };
      Object.keys(newMappings).forEach(key => {
        if (newMappings[key] === templateHeader) {
          delete newMappings[key];
        }
      });
      return newMappings;
    });
  };

  const convertCsv = async () => {
    if (!analysis) return;

    const mappedTemplateHeaders = Object.values(userMappings);
    const missingRequired = analysis.requiredHeaders.filter(
      header => !mappedTemplateHeaders.includes(header)
    );

    if (missingRequired.length > 0) {
      toast.error(`Missing required mappings: ${missingRequired.join(', ')}`);
      return;
    }

    try {
      setIsConverting(true);
      console.log('Converting CSV with mappings:', userMappings);

      const { data, error } = await supabase.functions.invoke('ai-csv-mapper', {
        body: {
          csvContent,
          action: 'convert',
          mappings: userMappings
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('CSV conversion complete');
      toast.success(`CSV converted successfully! ${data.convertedRowCount} rows processed.`);
      onMappingComplete(data.convertedCSV);

    } catch (error) {
      console.error('Error converting CSV:', error);
      toast.error('Failed to convert CSV: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsConverting(false);
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'to_name', 'to_company', 'to_street1', 'to_street2', 'to_city', 
      'to_state', 'to_zip', 'to_country', 'to_phone', 'to_email',
      'weight', 'length', 'width', 'height', 'reference'
    ];
    
    const csvContent = templateHeaders.join(',') + '\n' +
      'John Doe,Acme Corp,123 Main St,Apt 1,New York,NY,10001,US,555-1234,john@example.com,2.5,12,8,4,ORDER-001';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shipping_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">🧠 AI is Analyzing Your CSV Headers</h3>
            <p className="text-gray-600">Our AI is analyzing your CSV structure and suggesting the best mappings to our shipping template...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
            <p className="text-gray-600 mb-4">Could not analyze the CSV file. Please try again.</p>
            <Button onClick={onCancel} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mappedTemplateHeaders = Object.values(userMappings);
  const availableTemplateHeaders = [...analysis.requiredHeaders, ...analysis.optionalHeaders]
    .filter(header => !mappedTemplateHeaders.includes(header));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Template Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5" />
            💡 Need Our Template Instead?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-blue-700 text-sm mb-2">
                If you prefer to use our pre-formatted template, you can download it and format your data accordingly.
                This will skip the mapping process entirely.
              </p>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  ✅ No mapping required
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  ⚡ Faster processing
                </Badge>
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Mapping Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            🎯 Map Your CSV Headers to Our Template
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={analysis.suggestions.confidence === 'high' ? 'default' : 'secondary'}>
              🧠 AI Confidence: {analysis.suggestions.confidence}
            </Badge>
            <Badge variant="outline">
              📊 {analysis.detectedHeaders.length} headers detected
            </Badge>
            <Badge variant="outline">
              ✅ {Object.keys(userMappings).length} mapped
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📋 How this works:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Our AI has analyzed your CSV and suggested the best field mappings</li>
              <li>• Review and adjust mappings below - all <span className="font-semibold text-red-600">REQUIRED</span> fields must be mapped</li>
              <li>• Optional fields can be left unmapped if not available in your data</li>
              <li>• Click "Convert & Proceed" when you're satisfied with the mappings</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.detectedHeaders.map((detectedHeader) => (
              <Card key={detectedHeader} className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="font-medium text-sm">
                    📝 Your Header: <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">{detectedHeader}</span>
                  </div>
                  
                  <Select
                    value={userMappings[detectedHeader] || ''}
                    onValueChange={(value) => {
                      if (value === 'unmapped') {
                        const newMappings = { ...userMappings };
                        delete newMappings[detectedHeader];
                        setUserMappings(newMappings);
                      } else {
                        removeMappingForTemplate(value);
                        handleMappingChange(detectedHeader, value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="🎯 Select mapping..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unmapped">
                        <span className="text-gray-500">🚫 Don't map this field</span>
                      </SelectItem>
                      {analysis.requiredHeaders.map((header) => (
                        <SelectItem 
                          key={header} 
                          value={header}
                          disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 text-xs font-bold">🔴 REQUIRED</span>
                            <span className="font-mono text-xs">{header}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {analysis.optionalHeaders.map((header) => (
                        <SelectItem 
                          key={header} 
                          value={header}
                          disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xs font-bold">🔵 OPTIONAL</span>
                            <span className="font-mono text-xs">{header}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {userMappings[detectedHeader] && (
                    <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 p-2 rounded">
                      <CheckCircle className="h-3 w-3" />
                      ✅ Maps to <span className="font-mono font-medium">{userMappings[detectedHeader]}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Status Messages */}
          {analysis.requiredHeaders.some(header => !mappedTemplateHeaders.includes(header)) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                🚨 Missing Required Mappings
              </div>
              <div className="text-red-700 text-sm">
                The following required fields need to be mapped: {' '}
                <span className="font-mono font-semibold bg-red-100 px-1 rounded">
                  {analysis.requiredHeaders
                    .filter(header => !mappedTemplateHeaders.includes(header))
                    .join(', ')}
                </span>
              </div>
            </div>
          )}

          {analysis.detectedHeaders.filter(h => !userMappings[h]).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                ⚠️ Unmapped Headers
              </div>
              <div className="text-yellow-700 text-sm">
                These headers will be ignored: {' '}
                <span className="font-mono bg-yellow-100 px-1 rounded">
                  {analysis.detectedHeaders.filter(h => !userMappings[h]).join(', ')}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={convertCsv}
              disabled={
                isConverting || 
                analysis.requiredHeaders.some(header => !mappedTemplateHeaders.includes(header))
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  🔄 Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ✅ Convert & Proceed
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} className="px-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CsvHeaderMapper;
