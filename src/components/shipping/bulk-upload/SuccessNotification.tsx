
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Printer, Eye, Mail, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BulkLabelDownloadOptions from './BulkLabelDownloadOptions';
import { toast } from '@/components/ui/sonner';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels?: () => void;
  onDownloadSingleLabel: (shipmentId: string, format?: 'pdf' | 'png' | 'zpl' | 'epl') => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
  onOpenBatchPrintPreview?: () => void;
  onDownloadLabelsWithFormat: (format: 'pdf' | 'zpl' | 'epl' | 'pdfZip' | 'zplZip' | 'eplZip') => Promise<void>;
  onEmailLabels: (email: string) => Promise<void>;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  isPaying,
  isCreatingLabels,
  onOpenBatchPrintPreview,
  onDownloadLabelsWithFormat,
  onEmailLabels,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

  const { successful, failed, totalCost, processedShipments, batchResult } = results;
  const successfulShipments = processedShipments?.filter(s => s.status === 'completed') || [];
  const scanFormUrl = batchResult?.scanFormUrl;

  const handleEmailSubmit = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      await onEmailLabels(email);
      setShowEmailInput(false);
    } catch (error) {
      // Error already toasted by hook
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 border-green-500 bg-green-50 shadow-lg">
      <CardHeader className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <CardTitle className="text-2xl font-bold text-green-700">Bulk Upload Successful!</CardTitle>
        <CardDescription className="text-green-600">
          {successful} of {results.total} shipments processed successfully.
          {failed > 0 && ` ${failed} shipment(s) failed.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-md shadow">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p>Total Shipments Processed: {results.total}</p>
          <p>Successfully Created Labels: {successful}</p>
          {failed > 0 && <p className="text-red-600">Failed Shipments: {failed}</p>}
          {totalCost !== undefined && <p>Total Cost: ${totalCost.toFixed(2)}</p>}
          {batchResult?.batchId && <p>Batch ID: {batchResult.batchId}</p>}
        </div>

        {scanFormUrl && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">Scan Form Available</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open(scanFormUrl, '_blank')}>
              View Scan Form
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          {onOpenBatchPrintPreview && batchResult && (
            <Button onClick={onOpenBatchPrintPreview} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Eye className="mr-2 h-4 w-4" /> View/Print Batch Labels
            </Button>
          )}
          {!onOpenBatchPrintPreview && onDownloadAllLabels && batchResult && (
             <Button onClick={onDownloadAllLabels} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> Download All Labels (PDF)
            </Button>
          )}
        </div>
         <BulkLabelDownloadOptions 
            onDownloadLabelsWithFormat={onDownloadLabelsWithFormat} 
            disabled={isCreatingLabels || !batchResult}
            consolidatedUrls={batchResult?.consolidatedLabelUrls}
          />

        <div className="pt-2">
            <Button variant="outline" onClick={() => setShowEmailInput(!showEmailInput)} className="w-full sm:w-auto">
                <Mail className="mr-2 h-4 w-4" /> Email Labels
                {showEmailInput ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
            {showEmailInput && (
                <div className="mt-3 p-4 bg-white rounded-md shadow space-y-2">
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full p-2 border rounded-md"
                    />
                    <Button onClick={handleEmailSubmit} className="w-full sm:w-auto" size="sm">Send Email</Button>
                </div>
            )}
        </div>

        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="link" className="text-blue-600 hover:text-blue-800">
              {showDetails ? 'Hide' : 'Show'} Detailed Results
              {showDetails ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {successfulShipments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-md mb-2">Successful Shipments:</h4>
                <LabelResultsTable shipments={successfulShipments} onDownloadLabel={onDownloadSingleLabel} />
              </div>
            )}
            {results.failedShipments && results.failedShipments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-md mb-2 text-red-600">Failed Shipments:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 bg-red-50 p-3 rounded-md">
                  {results.failedShipments.map((fail, index) => (
                    <li key={index}>
                      Row {fail.row || 'N/A'}: {fail.error} {fail.details ? `(${JSON.stringify(fail.details)})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      <CardFooter className="flex justify-center">
         <Button onClick={() => window.location.reload()} variant="outline">
            Upload Another File
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuccessNotification;
