
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label component is not used, can be removed if not added back
// import { Label } from "@/components/ui/label"; 
import { Download, Printer } from 'lucide-react';
import { BulkShipment, BatchResult, LabelFormat, SavedAddress, ConsolidatedLabelUrls } from '@/types/shipping';
import { useToast } from "@/components/ui/use-toast";
import { useReactToPrint } from 'react-to-print';
// import { getLabelImage } from '@/lib/utils'; // Removed as getLabelImage is not used/exported

interface PrintPreviewProps {
  isOpenProp: boolean;
  onOpenChangeProp: (open: boolean) => void;
  batchResult?: BatchResult | null; // For batch mode
  processedShipments?: BulkShipment[]; // For batch mode or list display
  singleShipmentPreview?: BulkShipment | null; // For single shipment preview
  isBatchPreview: boolean; // Determines mode
  onDownloadFormat: (format: LabelFormat, shipmentId?: string) => Promise<void>; // shipmentId is optional, for single download
  pickupAddress: SavedAddress | null; // Can be null if not always available
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpenProp,
  onOpenChangeProp,
  batchResult,
  processedShipments = [], // Default to empty array
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
    if (isBatchPreview) {
      return processedShipments;
    }
    if (singleShipmentPreview) {
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
        const toAddress = shipment.details.to_address;
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
    }
  };

  const handleDownload = (format: LabelFormat) => {
    if (isBatchPreview) {
      onDownloadFormat(format);
    } else if (singleShipmentPreview) {
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

        <div ref={componentRef} className="space-y-4 p-1"> {/* Added p-1 for print padding */}
          {pickupAddress && (
            <div className="p-4 border rounded-md bg-gray-50">
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
                 {batchResult.consolidatedLabelUrls?.zip && ( // Assuming this is ZIP of PNGs
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
                type="text" // Changed to text to make it selectable, textarea could also work
                readOnly
                value={manifest}
                className="bg-gray-100 text-sm font-mono h-auto py-2" // Removed fixed height
                onClick={(e) => (e.target as HTMLInputElement).select()} // Cast to HTMLInputElement
              />
              <div className="flex justify-end mt-2">
                <Button onClick={copyToClipboard} disabled={isManifestCopied} size="sm">
                  {isManifestCopied ? 'Copied!' : 'Copy Manifest'}
                </Button>
              </div>
            </div>
          )}

          {shipmentsToDisplay.length > 0 && (
            <div className={`grid grid-cols-1 ${isBatchPreview && shipmentsToDisplay.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-4`}>
              {shipmentsToDisplay.map((shipment) => (
                <div key={shipment.id} className="border rounded-md p-4">
                  <h5 className="font-semibold mb-2">To: {shipment.details.to_address.name || shipment.customer_name || 'N/A'}</h5>
                  <p className="text-sm">{shipment.details.to_address.street1}</p>
                  {shipment.details.to_address.street2 && <p className="text-sm">{shipment.details.to_address.street2}</p>}
                  <p className="text-sm">{shipment.details.to_address.city}, {shipment.details.to_address.state} {shipment.details.to_address.zip}</p>
                  
                  {shipment.label_url ? ( // Primary label for display
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

                  {!isBatchPreview && singleShipmentPreview && (
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
