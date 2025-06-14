
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Printer } from 'lucide-react';
import { BulkShipment, BatchResult, LabelFormat, SavedAddress, ConsolidatedLabelUrls, AddressDetails, ParcelDetails } from '@/types/shipping';
import { useToast } from "@/components/ui/use-toast";
import { useReactToPrint } from 'react-to-print';

// This interface defines what the PrintPreview expects for a single shipment.
// It's a subset of BulkShipment or can be constructed as needed.
export interface SingleShipmentDataForPreview {
  id: string;
  label_url?: string | null; // Primary PNG URL
  label_urls?: { // Other formats
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  tracking_code?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  service?: string | null;
  details: {
    to_address: AddressDetails;
    // from_address could be added if needed for display
    parcel?: ParcelDetails; // Optional, for display
  };
  customer_name?: string; // Fallback if not in to_address.name
}


interface PrintPreviewProps {
  isOpenProp: boolean;
  onOpenChangeProp: (open: boolean) => void;
  batchResult?: BatchResult | null;
  processedShipments?: BulkShipment[]; // Used in batch mode
  singleShipmentPreview?: SingleShipmentDataForPreview | null; // For single shipment preview
  isBatchPreview: boolean;
  onDownloadFormat: (format: LabelFormat, shipmentId?: string) => Promise<void> | void; // shipmentId for single download
  pickupAddress: SavedAddress | null;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpenProp,
  onOpenChangeProp,
  batchResult,
  processedShipments = [],
  singleShipmentPreview,
  isBatchPreview,
  onDownloadFormat,
  pickupAddress
}) => {
  const [manifest, setManifest] = useState<string>('');
  const [isManifestCopied, setIsManifestCopied] = useState(false);
  const { toast } = useToast();
  const componentRef = useRef(null);

  const shipmentsToDisplay = useMemo(() => {
    if (isBatchPreview && processedShipments) {
      // In batch mode, map BulkShipment to SingleShipmentDataForPreview if needed,
      // or ensure processedShipments already fit the display structure.
      // For now, assuming processedShipments (which are BulkShipment[]) can be directly used if their structure matches display needs.
      return processedShipments.map(s => ({
        id: s.id,
        label_url: s.label_url,
        label_urls: s.label_urls,
        tracking_code: s.tracking_code,
        tracking_number: s.tracking_number,
        carrier: s.carrier,
        service: s.service,
        details: s.details,
        customer_name: s.customer_name,
      }));
    }
    if (!isBatchPreview && singleShipmentPreview) {
      return [singleShipmentPreview];
    }
    return [];
  }, [isBatchPreview, processedShipments, singleShipmentPreview]);

  const availableFormats = useMemo(() => {
    if (!isBatchPreview || !batchResult?.consolidatedLabelUrls) return [];
    const formats: { format: LabelFormat; url?: string; label: string }[] = [];
    const urls = batchResult.consolidatedLabelUrls;
    if (urls.pdf) formats.push({ format: 'pdf', url: urls.pdf, label: 'Download All as PDF' });
    if (urls.zpl) formats.push({ format: 'zpl', url: urls.zpl, label: 'Download All as ZPL' });
    if (urls.epl) formats.push({ format: 'epl', url: urls.epl, label: 'Download All as EPL' });
    if (urls.zip) formats.push({ format: 'zip', url: urls.zip, label: 'Download All as ZIP (PNGs)' });
    // Add handling for individual shipment formats if not in batch mode
    return formats;
  }, [isBatchPreview, batchResult]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Shipping Labels',
    onAfterPrint: () => {
      toast({
        title: "Labels printed!",
        description: "Your shipping labels have been sent to the printer.",
      });
    }
  });

  useEffect(() => {
    if (isOpenProp && shipmentsToDisplay.length > 0) {
      const newManifest = shipmentsToDisplay.map((shipment, index) => {
        // Ensure shipment.details and shipment.details.to_address exist
        const toAddress = shipment.details?.to_address;
        if (!toAddress) return `${index + 1}. Address details missing`;
  
        return `${index + 1}. ${toAddress.name || shipment.customer_name || 'N/A'}, ${toAddress.street1}, ${toAddress.city}, ${toAddress.state} ${toAddress.zip}, ${toAddress.country} - Tracking: ${shipment.tracking_code || shipment.tracking_number || 'N/A'}`;
      }).join('\n');
      setManifest(newManifest);
    }
  }, [isOpenProp, shipmentsToDisplay]);

  const copyToClipboard = () => {
    if (manifest) {
      navigator.clipboard.writeText(manifest);
      setIsManifestCopied(true);
      toast({
        title: "Manifest Copied!",
        description: "The shipping manifest has been copied to your clipboard.",
      });
      // Reset copied status after a delay
      setTimeout(() => setIsManifestCopied(false), 2000);
    }
  };

  const handleDownload = (format: LabelFormat) => {
    if (isBatchPreview) {
      // For batch, onDownloadFormat might not need shipmentId if it downloads a consolidated file
      onDownloadFormat(format);
    } else if (singleShipmentPreview && singleShipmentPreview.id) {
      onDownloadFormat(format, singleShipmentPreview.id);
    } else {
      toast({ title: "Error", description: "No shipment selected for download.", variant: "destructive" });
    }
  };


  return (
    <Dialog open={isOpenProp} onOpenChange={onOpenChangeProp}>
      <DialogContent className="max-w-[90%] max-h-[90vh] overflow-y-auto sm:max-w-[75%] sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{isBatchPreview ? 'Batch Print Preview' : 'Print Preview'}</DialogTitle>
          <DialogDescription>
            {isBatchPreview ? 'Review and download your batch shipping labels.' : 'Review and download your shipping label.'}
          </DialogDescription>
        </DialogHeader>

        <div ref={componentRef} className="space-y-4 p-1">
          {pickupAddress && (
            <div className="p-4 border rounded-md bg-gray-50 print-friendly-address">
              <h4 className="font-semibold mb-1">Pickup Address</h4>
              <p className="text-sm">
                {pickupAddress.name && <>{pickupAddress.name}<br /></>}
                {pickupAddress.company && <>{pickupAddress.company}<br /></>}
                {pickupAddress.street1}<br />
                {pickupAddress.street2 && <>{pickupAddress.street2}<br /></>}
                {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}<br />
                {pickupAddress.country}
                {pickupAddress.phone && <><br />Phone: {pickupAddress.phone}</>}
              </p>
            </div>
          )}

          {isBatchPreview && batchResult && (
            <div className="p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Batch Summary</h4>
              <p>Batch ID: {batchResult.batchId}</p>
              <p>Total Shipments in Batch: {processedShipments.length}</p>
              {batchResult.scanFormUrl && (
                 <Button 
                    onClick={() => window.open(batchResult.scanFormUrl!, '_blank')} 
                    variant="outline" 
                    className="mt-2">
                   <Download className="mr-2 h-4 w-4" /> Download Scan Form (PDF)
                 </Button>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {batchResult.consolidatedLabelUrls?.pdf && (
                  <Button onClick={() => handleDownload('pdf')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All PDF
                  </Button>
                )}
                {batchResult.consolidatedLabelUrls?.zpl && (
                  <Button onClick={() => handleDownload('zpl')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All ZPL
                  </Button>
                )}
                {batchResult.consolidatedLabelUrls?.epl && (
                  <Button onClick={() => handleDownload('epl')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All EPL
                  </Button>
                )}
                 {batchResult.consolidatedLabelUrls?.zip && (
                  <Button onClick={() => handleDownload('zip')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All as ZIP
                  </Button>
                )}
              </div>
            </div>
          )}

          {(isBatchPreview || singleShipmentPreview) && manifest && (
            <div className="p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Shipping Manifest</h4>
              <Input
                type="text"
                readOnly
                value={manifest}
                className="bg-gray-100 text-sm font-mono h-auto py-2"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <div className="flex justify-end mt-2">
                <Button onClick={copyToClipboard} disabled={isManifestCopied} size="sm">
                  {isManifestCopied ? 'Copied!' : 'Copy Manifest'}
                </Button>
              </div>
            </div>
          )}

          {shipmentsToDisplay.length > 0 && (
             <div className={`grid grid-cols-1 ${isBatchPreview && shipmentsToDisplay.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-4 print-labels-grid`}>
              {shipmentsToDisplay.map((shipment) => (
                <div key={shipment.id} className="border rounded-md p-4 print-label-item">
                  <h5 className="font-semibold mb-2">To: {shipment.details?.to_address?.name || shipment.customer_name || 'N/A'}</h5>
                  <p className="text-sm">{shipment.details?.to_address?.street1}</p>
                  {shipment.details?.to_address?.street2 && <p className="text-sm">{shipment.details.to_address.street2}</p>}
                  <p className="text-sm">{shipment.details?.to_address?.city}, {shipment.details?.to_address?.state} {shipment.details?.to_address?.zip}</p>
                  
                  {shipment.label_url ? (
                    <img 
                        src={shipment.label_url} 
                        alt={`Shipping Label for ${shipment.id}`} 
                        className="max-w-full mb-2 mt-2 border" 
                    />
                  ) : (
                    <p className="text-sm text-red-500 my-2">Label image not available for preview.</p>
                  )}
                  <p className="text-sm">Tracking: {shipment.tracking_code || shipment.tracking_number || 'N/A'}</p>
                  <p className="text-sm">Carrier: {shipment.carrier || 'N/A'}, Service: {shipment.service || 'N/A'}</p>

                  {!isBatchPreview && singleShipmentPreview && singleShipmentPreview.id === shipment.id && (
                    <div className="flex flex-wrap gap-2 mt-3">
                       {(singleShipmentPreview.label_urls?.png || singleShipmentPreview.label_url) && (
                        <Button size="sm" variant="outline" onClick={() => handleDownload('png')}>
                          <Download className="mr-1 h-3 w-3" /> PNG
                        </Button>
                      )}
                      {singleShipmentPreview.label_urls?.pdf && (
                        <Button size="sm" variant="outline" onClick={() => handleDownload('pdf')}>
                          <Download className="mr-1 h-3 w-3" /> PDF
                        </Button>
                      )}
                      {singleShipmentPreview.label_urls?.zpl && (
                        <Button size="sm" variant="outline" onClick={() => handleDownload('zpl')}>
                          <Download className="mr-1 h-3 w-3" /> ZPL
                        </Button>
                      )}
                       {singleShipmentPreview.label_urls?.epl && (
                        <Button size="sm" variant="outline" onClick={() => handleDownload('epl')}>
                          <Download className="mr-1 h-3 w-3" /> EPL
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {shipmentsToDisplay.length === 0 && (
             <p className="text-center text-gray-500 py-4">No shipments to preview.</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6 p-4 border-t">
          <Button type="button" variant="secondary" onClick={() => onOpenChangeProp(false)}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint} disabled={shipmentsToDisplay.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;
