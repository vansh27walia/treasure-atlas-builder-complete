
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import ApiKeySetup from './ApiKeySetup';
import CsvUploader from './CsvUploader';
import ProcessingResults from './ProcessingResults';
import ProcessingHistory from './ProcessingHistory';
import { ProcessingLog } from '@/services/BatchProcessingService';

const BatchLabelProcessor: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessingLog, setCurrentProcessingLog] = useState<ProcessingLog | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const handleFileSelect = (file: File, rows: number) => {
    setSelectedFile(file);
    setRowCount(rows);
    setCurrentProcessingLog(null);
    setDownloadUrl('');
    setProgress(0);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile || !hasApiKey) {
      toast.error('Please select a file and configure your API key');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Upload the file and start processing
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const { data, error } = await supabase.functions.invoke('process-batch-labels', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Failed to start processing');
      }

      if (data) {
        setCurrentProcessingLog(data.processingLog);
        setDownloadUrl(data.downloadUrl || '');
        
        if (data.processingLog?.processing_status === 'completed') {
          setProgress(100);
          toast.success(`Successfully processed ${data.processingLog.processed_row_count} labels`);
        } else if (data.processingLog?.processing_status === 'failed') {
          toast.error(data.processingLog.error_message || 'Processing failed');
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process labels: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.success('Download started');
    } else {
      toast.error('Download not available');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Batch Label Processing</h1>
        <p className="text-gray-600">
          Upload CSV files and generate AI-powered label content using OpenAI
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* API Key Setup */}
          <ApiKeySetup onApiKeySet={setHasApiKey} />

          {/* CSV Upload */}
          {hasApiKey && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Upload CSV File</CardTitle>
              </CardHeader>
              <CardContent>
                <CsvUploader 
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* Processing Controls */}
          {hasApiKey && selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Process Labels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{rowCount} rows to process</p>
                  </div>
                  <Button 
                    onClick={handleStartProcessing}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isProcessing ? 'Processing...' : 'Start Processing'}
                  </Button>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                {!hasApiKey && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Please configure your OpenAI API key to start processing labels.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Processing Results */}
          {currentProcessingLog && (
            <ProcessingResults 
              processingLog={currentProcessingLog}
              downloadUrl={downloadUrl}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Processing History Sidebar */}
        <div className="space-y-6">
          <ProcessingHistory />
        </div>
      </div>
    </div>
  );
};

export default BatchLabelProcessor;
