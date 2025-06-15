
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Download, RefreshCw } from 'lucide-react';
import { BatchProcessingService, ProcessingLog } from '@/services/BatchProcessingService';
import { toast } from '@/components/ui/sonner';

const ProcessingHistory: React.FC = () => {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProcessingLogs();
  }, []);

  const loadProcessingLogs = async () => {
    setIsLoading(true);
    try {
      const processingLogs = await BatchProcessingService.getProcessingLogs();
      setLogs(processingLogs);
    } catch (error) {
      console.error('Error loading processing logs:', error);
      toast.error('Failed to load processing history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: 'pending' | 'processing' | 'completed' | 'failed') => {
    const variantMap: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variantMap[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDownload = (log: ProcessingLog) => {
    if (log.download_url) {
      window.open(log.download_url, '_blank');
    } else {
      toast.error('Download not available for this file');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading processing history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Processing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No processing history found</p>
            <p className="text-sm">Upload and process a CSV file to see results here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{log.filename}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(log.processing_status)}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-1 font-medium">{log.original_row_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processed:</span>
                    <span className="ml-1 font-medium">{log.processed_row_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <span className="ml-1 font-medium">{log.failed_row_count}</span>
                  </div>
                </div>
                
                {log.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {log.error_message}
                  </div>
                )}
                
                {log.processing_status === 'completed' && log.download_url && (
                  <Button 
                    onClick={() => handleDownload(log)} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Result
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingHistory;
