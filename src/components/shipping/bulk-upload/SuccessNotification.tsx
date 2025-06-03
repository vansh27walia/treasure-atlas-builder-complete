
import React from 'react';
import { Check, Download } from 'lucide-react';
import OrderSummary from './OrderSummary';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import FailedShipmentsTable from './FailedShipmentsTable';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: (format?: string) => void;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
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
  // Check if any shipment is missing a label
  const missingLabels = results.processedShipments.some(s => !s.label_url);
  const hasLabels = results.processedShipments.some(s => s.label_url);
  const allShipmentsWithLabels = results.processedShipments.filter(s => s.label_url);

  // Handle individual label download
  const handleDownloadSingleLabelWrapper = (labelUrl: string, format: string = 'png') => {
    if (!labelUrl) {
      console.warn('No label URL provided');
      return;
    }
    
    console.log('Downloading single label:', labelUrl, 'format:', format);
    
    // Direct download from stored URL
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `shipping_label.${format}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onDownloadSingleLabel(labelUrl, format);
  };

  // Handle bulk download with format options
  const handleBulkDownloadWithFormat = (format: string) => {
    console.log('Downloading bulk labels with format:', format);
    console.log('Available URLs:', {
      png: results.bulk_label_png_url,
      pdf: results.bulk_label_pdf_url
    });

    if (format === 'png' && results.bulk_label_png_url) {
      // Use the bulk PNG URL from results
      const link = document.createElement('a');
      link.href = results.bulk_label_png_url;
      link.download = `bulk_shipping_labels.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf' && results.bulk_label_pdf_url) {
      // Use the bulk PDF URL from results
      const link = document.createElement('a');
      link.href = results.bulk_label_pdf_url;
      link.download = `bulk_shipping_labels.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback to individual labels download
      console.log('No bulk URL available, downloading individual labels');
      allShipmentsWithLabels.forEach((shipment, index) => {
        if (shipment.label_url) {
          setTimeout(() => {
            handleDownloadSingleLabelWrapper(shipment.label_url!, format);
          }, index * 500); // Stagger downloads
        }
      });
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-md mb-6">
      <div className="p-4">
        <div className="flex items-center mb-2">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-800">Labels Created Successfully!</h4>
        </div>
        <p className="text-green-700 mb-3">
          Successfully created {allShipmentsWithLabels.length} shipping labels out of {results.total} shipments
          {results.failed > 0 && ` (${results.failed} failed)`}
        </p>
      
        {missingLabels && (
          <div className="mt-3">
            <Button 
              onClick={onCreateLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
              disabled={isCreatingLabels}
            >
              {isCreatingLabels ? "Creating Labels..." : "Create Remaining Labels"}
            </Button>
          </div>
        )}

        {hasLabels && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              onClick={() => handleBulkDownloadWithFormat('png')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All PNG Labels
            </Button>
            <Button 
              onClick={() => handleBulkDownloadWithFormat('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All PDF Labels
            </Button>
          </div>
        )}
      </div>
      
      {hasLabels && (
        <SuccessfulShipmentsTable 
          shipments={allShipmentsWithLabels}
          onDownloadSingleLabel={handleDownloadSingleLabelWrapper}
          onDownloadAllLabels={handleBulkDownloadWithFormat}
        />
      )}
      
      {results.failedShipments && results.failedShipments.length > 0 && (
        <FailedShipmentsTable 
          shipments={results.failedShipments} 
        />
      )}
    </div>
  );
};

export default SuccessNotification;
