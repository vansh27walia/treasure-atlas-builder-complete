
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Download, FileText, Star, Package, Upload, Zap } from 'lucide-react';
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
      console.log('Analyzing CSV headers with Gemini...');

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

  const downloadVvapTemplate = () => {
    const templateHeaders = [
      'to_name', 'to_company', 'to_street1', 'to_street2', 'to_city', 
      'to_state', 'to_zip', 'to_country', 'to_phone', 'to_email',
      'weight', 'length', 'width', 'height', 'reference'
    ];
    
    const csvContent = templateHeaders.join(',') + '\n' +
      'John Doe,VVAP Global Solutions,123 Business Ave,Suite 200,San Francisco,CA,94105,US,555-123-4567,orders@vvapglobal.com,2.5,12,8,4,VVAP-ORDER-001\n' +
      'Jane Smith,VVAP Enterprises,456 Commerce Blvd,,Los Angeles,CA,90210,US,555-987-6543,shipping@vvapglobal.com,1.8,10,6,3,VVAP-ORDER-002\n' +
      'Mike Johnson,VVAP Logistics,789 Trade Center Dr,Floor 3,Chicago,IL,60601,US,555-456-7890,logistics@vvapglobal.com,3.2,14,9,5,VVAP-ORDER-003';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vvap_global_shipping_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">🤖 AI Analyzing Your CSV Headers</h3>
            <p className="text-gray-600">Our intelligent system is mapping your CSV structure to VVAP Global's shipping template...</p>
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Enhanced Template Explanation Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <Package className="h-6 w-6" />
            Two Ways to Upload Your Shipping Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Method 1: Template */}
            <div className="bg-white p-5 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Method 1: Use Our Template</h4>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-sm text-green-700 mb-3">
                Download our pre-formatted CSV template with correct headers for instant compatibility. No mapping required!
              </p>
              <ul className="space-y-1 text-xs text-green-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Skip header mapping entirely
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Includes sample VVAP Global data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Professional formatting
                </li>
              </ul>
              <Button 
                onClick={downloadVvapTemplate} 
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Method 2: Any CSV */}
            <div className="bg-white p-5 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Method 2: Upload Any CSV</h4>
                <Zap className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Upload your existing CSV file and our AI will intelligently map your headers to our shipping format.
              </p>
              <ul className="space-y-1 text-xs text-blue-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Works with any CSV format
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  AI-powered header detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Smart mapping suggestions
                </li>
              </ul>
              <div className="text-sm font-medium text-blue-800 bg-blue-100 p-2 rounded">
                This is what you're doing now! ⬇️
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improved Header Mapping Interface */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-green-600" />
            Smart Header Mapping System
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={analysis.suggestions.confidence === 'high' ? 'default' : 'secondary'}>
              🤖 AI Confidence: {analysis.suggestions.confidence}
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
          {/* Instructions */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🎯 How It Works:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Our AI analyzed your CSV and suggested optimal mappings below</li>
              <li>• Review each mapping - <span className="font-semibold text-red-600">RED</span> fields are required</li>
              <li>• <span className="font-semibold text-blue-600">BLUE</span> fields are optional but recommended</li>
              <li>• Click "Convert & Process" when satisfied with mappings</li>
            </ul>
          </div>

          {/* Improved Grid Layout for Header Mapping */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-100 rounded-lg font-medium text-sm">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Your CSV Header</div>
              <div className="col-span-1 text-center">→</div>
              <div className="col-span-4">Template Field</div>
              <div className="col-span-2 text-center">Status</div>
            </div>
            
            {analysis.detectedHeaders.map((detectedHeader, index) => (
              <div key={detectedHeader} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                {/* Step Number */}
                <div className="col-span-1 flex justify-center">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    {index + 1}
                  </div>
                </div>
                
                {/* Your Header */}
                <div className="col-span-4">
                  <div className="text-xs text-gray-500 mb-1">Your CSV Header:</div>
                  <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded border">
                    "{detectedHeader}"
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="col-span-1 flex justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Template Mapping */}
                <div className="col-span-4">
                  <div className="text-xs text-gray-500 mb-1">Maps to:</div>
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
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select mapping..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="unmapped">
                        <span className="text-gray-500">🚫 Don't map</span>
                      </SelectItem>
                      
                      {/* Required Headers */}
                      {analysis.requiredHeaders.map((header) => (
                        <SelectItem 
                          key={header} 
                          value={header}
                          disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 text-xs font-bold">🔴</span>
                            <span className="font-mono text-xs">{header}</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Optional Headers */}
                      {analysis.optionalHeaders.map((header) => (
                        <SelectItem 
                          key={header} 
                          value={header}
                          disabled={mappedTemplateHeaders.includes(header) && userMappings[detectedHeader] !== header}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 text-xs font-bold">🔵</span>
                            <span className="font-mono text-xs">{header}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Indicator */}
                <div className="col-span-2 flex justify-center">
                  {userMappings[detectedHeader] ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                      <CheckCircle className="h-3 w-3" />
                      <span className="font-medium">Mapped</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3" />
                      <span>Unmapped</span>
                    </div>
                  )}
                </div>
              </div>
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
                These required fields must be mapped: {' '}
                <span className="font-mono font-semibold bg-red-100 px-2 py-1 rounded">
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
                <span className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {analysis.detectedHeaders.filter(h => !userMappings[h]).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={convertCsv}
              disabled={
                isConverting || 
                analysis.requiredHeaders.some(header => !mappedTemplateHeaders.includes(header))
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  🔄 Converting CSV...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  ✅ Convert & Process Shipments
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} className="px-8 h-12">
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
