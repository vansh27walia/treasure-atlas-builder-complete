
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Brain } from 'lucide-react';
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

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 shadow-lg">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">AI is Analyzing Your CSV Headers</h3>
            <p className="text-lg text-gray-600">Our AI is analyzing your CSV structure and suggesting the best mappings to our shipping template...</p>
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
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Brain className="h-7 w-7" />
            AI-Powered CSV Header Mapping
          </CardTitle>
          <div className="flex gap-3 flex-wrap pt-2">
            <Badge variant={analysis.suggestions.confidence === 'high' ? 'default' : 'secondary'} className="bg-white/20 text-white">
              🧠 AI Confidence: {analysis.suggestions.confidence}
            </Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              📊 {analysis.detectedHeaders.length} headers detected
            </Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              ✅ {Object.keys(userMappings).length} mapped
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-800 mb-3 text-lg">📋 How this works:</h4>
            <ul className="text-blue-700 space-y-2">
              <li>• Review the AI-suggested mappings below</li>
              <li>• Adjust any mappings that don't look correct</li>
              <li>• All <span className="font-bold text-red-600">REQUIRED</span> fields must be mapped</li>
              <li>• Click "Convert & Proceed" when ready</li>
            </ul>
          </div>

          {/* Vertical Layout for Header Mappings */}
          <div className="space-y-4">
            {analysis.detectedHeaders.map((detectedHeader) => (
              <Card key={detectedHeader} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-2">
                        📝 Your CSV Header: <span className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">{detectedHeader}</span>
                      </div>
                      
                      <Select
                        value={userMappings[detectedHeader] || '__NONE__'}
                        onValueChange={(value) => {
                          if (value === '__NONE__') {
                            const newMappings = { ...userMappings };
                            delete newMappings[detectedHeader];
                            setUserMappings(newMappings);
                          } else {
                            removeMappingForTemplate(value);
                            handleMappingChange(detectedHeader, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full lg:w-80">
                          <SelectValue placeholder="🎯 Select mapping..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__NONE__">
                            <span className="text-gray-500">🚫 Don't map this field</span>
                          </SelectItem>
                          <div className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50">
                            REQUIRED FIELDS
                          </div>
                          {analysis.requiredHeaders.map((header) => (
                            <SelectItem 
                              key={header} 
                              value={header}
                              disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 text-xs font-bold">🔴</span>
                                <span className="font-mono">{header}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50">
                            OPTIONAL FIELDS
                          </div>
                          {analysis.optionalHeaders.map((header) => (
                            <SelectItem 
                              key={header} 
                              value={header}
                              disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-blue-600 text-xs font-bold">🔵</span>
                                <span className="font-mono">{header}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-shrink-0">
                      {userMappings[detectedHeader] && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Maps to: {userMappings[detectedHeader]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Messages */}
          {analysis.requiredHeaders.some(header => !mappedTemplateHeaders.includes(header)) && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3 text-red-800 font-bold mb-3">
                <AlertCircle className="h-5 w-5" />
                🚨 Missing Required Mappings
              </div>
              <div className="text-red-700">
                The following required fields need to be mapped: {' '}
                <span className="font-mono font-bold bg-red-100 px-2 py-1 rounded">
                  {analysis.requiredHeaders
                    .filter(header => !mappedTemplateHeaders.includes(header))
                    .join(', ')}
                </span>
              </div>
            </div>
          )}

          {analysis.detectedHeaders.filter(h => !userMappings[h]).length > 0 && (
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3 text-yellow-800 font-bold mb-3">
                <AlertCircle className="h-5 w-5" />
                ⚠️ Unmapped Headers
              </div>
              <div className="text-yellow-700">
                These headers will be ignored: {' '}
                <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {analysis.detectedHeaders.filter(h => !userMappings[h]).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={convertCsv}
              disabled={
                isConverting || 
                analysis.requiredHeaders.some(header => !mappedTemplateHeaders.includes(header))
              }
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  🔄 Converting CSV...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  ✅ Convert & Proceed to Rates
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} className="h-12 px-8">
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
