
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, UploadCloud } from 'lucide-react';

interface UploadErrorProps {
  errorMessage: string;
  onRetry: () => void;
  onSelectNewFile: () => void;
  failedShipments?: Array<{ shipmentId?: string; error: string; row?: number; details?: any }>; // Added prop
}

const UploadError: React.FC<UploadErrorProps> = ({ errorMessage, onRetry, onSelectNewFile, failedShipments }) => {
  return (
    <Card className="w-full max-w-lg mx-auto mt-8 border-red-500 bg-red-50">
      <CardHeader className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <CardTitle className="text-red-700">Upload Failed</CardTitle>
        <CardDescription className="text-red-600">
          {errorMessage || "An unexpected error occurred during the upload process."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {failedShipments && failedShipments.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md max-h-60 overflow-y-auto">
            <h4 className="font-semibold text-sm text-red-700 mb-2">Specific Errors:</h4>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
              {failedShipments.map((item, index) => (
                <li key={item.shipmentId || index}>
                  {item.row && `Row ${item.row}: `}
                  {item.error}
                  {item.details && typeof item.details === 'string' && ` (${item.details})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
        <Button onClick={onRetry} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again With Same File
        </Button>
        <Button onClick={onSelectNewFile} className="w-full sm:w-auto">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload a Different File
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UploadError;

