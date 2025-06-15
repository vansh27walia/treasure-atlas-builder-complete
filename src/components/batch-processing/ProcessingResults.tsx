
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ProcessingLog } from '@/services/BatchProcessingService';

interface ProcessingResultsProps {
  processingLog: ProcessingLog | null;
  downloadUrl?: string;
  onDownload: () => void;
}

const ProcessingResults: React.FC<ProcessingResultsProps> = ({ 
  processingLog, 
  downloadUrl, 
  onDownload 
}) => {
  if (!processingLog) return null;

  const getStatusIcon = () => {
    switch (processingLog.processing_status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (processingLog.processing_status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (processingLog.processing_status) {
      case 'completed':
        return 'text-green-800';
      case 'failed':
        return 'text-red-800';
      case 'processing':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Processing Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className={getStatusColor()}>
          <AlertDescription className={getStatusText()}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium capitalize">{processingLog.processing_status}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Rows:</span>
                <span className="font-medium">{processingLog.original_row_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Processed:</span>
                <span className="font-medium">{processingLog.processed_row_count}</span>
              </div>
              {processingLog.failed_row_count > 0 && (
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{processingLog.failed_row_count}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>File:</span>
                <span className="font-medium">{processingLog.filename}</span>
              </div>
              {processingLog.completed_at && (
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium">
                    {new Date(processingLog.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {processingLog.error_message && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {processingLog.error_message}
            </AlertDescription>
          </Alert>
        )}

        {processingLog.processing_status === 'completed' && downloadUrl && (
          <Button onClick={onDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Processed CSV
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingResults;
