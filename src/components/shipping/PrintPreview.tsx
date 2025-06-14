import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Printer } from 'lucide-react';
import { BulkShipment, BatchResult, LabelFormat, ConsolidatedLabelUrls, SavedAddress } from '@/types/shipping';
import { useToast } from "@/components/ui/use-toast"
import { useReactToPrint } from 'react-to-print';
import { getLabelImage } from '@/lib/utils';

interface PrintPreviewProps {
  isOpenProp: boolean;
  onOpenChangeProp: (open: boolean) => void;
  batchResult?: BatchResult | null;
  processedShipments: BulkShipment[];
  isBatchPreview: boolean;
  onDownloadFormat: (format: string) => Promise<void>;
  pickupAddress: SavedAddress;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpenProp,
  onOpenChangeProp,
  batchResult,
  processedShipments,
  isBatchPreview,
  onDownloadFormat,
  pickupAddress
}) => {
  const [manifest, setManifest] = useState<string>('');
  const [isManifestCopied, setIsManifestCopied] = useState(false);
  const { toast } = useToast();
  const componentRef = React.useRef(null);

  const availableFormats = useMemo(() => {
    if (!isBatchPreview || !batchResult?.consolidatedLabelUrls) return [];
    const formats: { format: LabelFormat; url: string; label: string }[] = [];
    if (batchResult.consolidatedLabelUrls.pdf) {
      formats.push({ format: 'pdf', url: batchResult.consolidatedLabelUrls.pdf, label: 'Download All as PDF' });
    }
    if (batchResult.consolidatedLabelUrls.zpl) {
      formats.push({ format: 'zpl', url: batchResult.consolidatedLabelUrls.zpl, label: 'Download All as ZPL' });
    }
    if (batchResult.consolidatedLabelUrls.epl) {
      formats.push({ format: 'epl', url: batchResult.consolidatedLabelUrls.epl, label: 'Download All as EPL' });
    }
    if (batchResult.consolidatedLabelUrls.zip) { // This is likely the ZIP of PNGs or a mix
      formats.push({ format: 'zip', url: batchResult.consolidatedLabelUrls.zip, label: 'Download All as ZIP' });
    }
    return formats;
  }, [isBatchPreview, batchResult]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Shipping Labels',
    onAfterPrint: () => {
      toast({
        title: "Labels printed!",
        description: "Your shipping labels have been sent to the printer.",
      })
    }
  });

  useEffect(() => {
    if (isOpenProp && processedShipments && processedShipments.length > 0) {
      const newManifest = processedShipments.map((shipment, index) => {
        const toAddress = shipment.details.to_address;
        return `${index + 1}. ${toAddress.name}, ${toAddress.street1}, ${toAddress.city}, ${toAddress.state} ${toAddress.zip}, ${toAddress.country} - Tracking: ${shipment.tracking_number || 'N/A'}`;
      }).join('\n');
      setManifest(newManifest);
    }
  }, [isOpenProp, processedShipments]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(manifest);
    setIsManifestCopied(true);
    toast({
      title: "Manifest Copied!",
      description: "The shipping manifest has been copied to your clipboard.",
    })
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

        <div ref={componentRef} className="space-y-4">
          {isBatchPreview && batchResult && (
            <div className="p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Batch Summary</h4>
              <p>Batch ID: {batchResult.batchId}</p>
              {pickupAddress && (
                <p>
                  <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}, {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {batchResult.consolidatedLabelUrls?.pdf && (
                  <Button onClick={() => onDownloadFormat?.('pdf')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All PDF
                  </Button>
                )}
                {batchResult.consolidatedLabelUrls?.zpl && (
                  <Button onClick={() => onDownloadFormat?.('zpl')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All ZPL
                  </Button>
                )}
                {batchResult.consolidatedLabelUrls?.epl && (
                  <Button onClick={() => onDownloadFormat?.('epl')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All EPL
                  </Button>
                )}
                {batchResult.consolidatedLabelUrls?.zip && (
                  <Button onClick={() => onDownloadFormat?.('zip')} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download All as ZIP
                  </Button>
                )}
              </div>
            </div>
          )}

          {isBatchPreview && manifest && (
            <div className="p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Shipping Manifest</h4>
              <Input
                type="text"
                readOnly
                value={manifest}
                className="bg-gray-100 text-sm font-mono h-auto py-2"
                onClick={(e) => e.target.select()}
              />
              <div className="flex justify-end mt-2">
                <Button onClick={copyToClipboard} disabled={isManifestCopied} size="sm">
                  {isManifestCopied ? 'Copied!' : 'Copy Manifest'}
                </Button>
              </div>
            </div>
          )}

          {processedShipments && processedShipments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedShipments.map((shipment) => (
                <div key={shipment.id} className="border rounded-md p-4">
                  <h5 className="font-semibold mb-2">Shipment to: {shipment.details.to_address.name}</h5>
                  {shipment.label_url && (
                    <img src={shipment.label_url} alt="Shipping Label" className="max-w-full mb-2" />
                  )}
                  <p>Tracking Number: {shipment.tracking_number || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChangeProp(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;
