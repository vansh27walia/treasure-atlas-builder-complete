
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BulkUploadResult } from '@/types/shipping';
import { FileCheck, Download, Check, CheckCircle, Printer, Box } from 'lucide-react';
import ShippingLabel from '../ShippingLabel';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string) => void;
  onProceedToPayment: () => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onProceedToPayment,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  const hasLabels = results.processedShipments.some(s => s.label_url);
  
  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-6 border border-green-200 rounded-lg text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
        <h2 className="text-xl font-bold text-green-800 mb-2">Bulk Processing Complete!</h2>
        <p className="text-green-700">
          Successfully processed {results.successful} out of {results.successful + results.failed} shipments
        </p>
        <div className="flex justify-center space-x-4 mt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={onDownloadAllLabels}
          >
            <Download className="h-4 w-4" />
            Download All Labels
          </Button>
        </div>
      </div>
      
      {!hasLabels && (
        <div className="bg-blue-50 p-6 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Generate Shipping Labels</h3>
          <p className="text-blue-700 mb-4">
            Your shipments have been processed. Generate labels to prepare your packages for shipping.
          </p>
          <Button 
            onClick={onCreateLabels}
            disabled={isCreatingLabels}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingLabels ? 'Generating Labels...' : 'Generate All Labels'}
          </Button>
        </div>
      )}

      {/* Display labels for each shipment that has one */}
      <div className="space-y-8 mt-4">
        {results.processedShipments
          .filter(shipment => shipment.label_url && shipment.tracking_code)
          .map((shipment) => (
            <ShippingLabel 
              key={shipment.id}
              labelUrl={shipment.label_url || null}
              trackingCode={shipment.tracking_code || null}
              shipmentId={shipment.id}
            />
          ))}
      </div>
      
      {hasLabels && results.processedShipments.length > 0 && (
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Shipping Summary</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Total Shipments:</span> {results.processedShipments.length}</p>
            <p><span className="font-medium">Total Cost:</span> ${results.totalCost.toFixed(2)}</p>
            <p><span className="font-medium">Shipping Services:</span> Multiple carriers</p>
          </div>
          <div className="mt-4 space-x-4">
            <Button variant="outline" onClick={onDownloadAllLabels}>Download All Labels</Button>
            <Link to="/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessNotification;
