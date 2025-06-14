import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, PackageCheck, PackagePlus, Truck } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { getShippingRates, purchaseShippingLabel } from '@/lib/easypost';
import { Address, Shipment } from '@easypost/api/shipment';
import { AddressDetails, ParcelDetails, ShippingAddress, ShippingOption, GoogleApiKeyResponse, SavedAddress, LabelFormat } from '@/types/shipping';
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';
import { SavedAddress, LabelFormat } from '@/types/shipping'; // Added LabelFormat

interface ShippingRatesProps {
  toAddress: AddressDetails;
  parcel: ParcelDetails;
  customsInfo?: any;
  options?: any;
  fromAddress?: SavedAddress | null; 
}


const ShippingRates: React.FC<ShippingRatesProps> = ({ 
  toAddress,
  parcel,
  customsInfo,
  options,
  fromAddress,
 }) => {
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string>('');
  const [currentShipmentId, setCurrentShipmentId] = useState<string>('');
  const [availableLabelUrls, setAvailableLabelUrls] = useState<{ pdf?: string; png?: string; zpl?: string; epl?: string }>({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast()
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);


  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        if (!toAddress || !parcel) {
          console.error("To address or parcel details are missing.");
          return;
        }

        const fetchedRates = await getShippingRates(toAddress, parcel, customsInfo, options, fromAddress);
        setRates(fetchedRates);
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
        toast({
          title: "Error Fetching Rates",
          description: "Failed to retrieve shipping rates. Please check your details and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [toAddress, parcel, customsInfo, options, fromAddress]);

  const downloadLabel = (labelUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFormatChange = async (format: string) => {
    console.log('Format change requested:', format, currentShipmentId);
    if (!currentShipmentId) {
      toast({
        title: "Shipment ID Missing",
        description: "Cannot change label format without a shipment ID.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const purchaseResult = await purchaseShippingLabel(currentShipmentId, format);
      console.log('Purchase result:', purchaseResult);

      if (purchaseResult && purchaseResult.label_url) {
        setGeneratedLabelUrl(purchaseResult.label_url);
        setTrackingCode(purchaseResult.tracking_code);
        setAvailableLabelUrls({ png: purchaseResult.label_url, pdf: purchaseResult.label_url }); // Update available URLs

        toast({
          title: "Label Re-generated!",
          description: `New label in ${format.toUpperCase()} format generated. Tracking: ${purchaseResult.tracking_code}`,
          action: <ToastAction altText="Download" onClick={() => downloadLabel(purchaseResult.label_url, `label_${purchaseResult.tracking_code}.${format}`)}>Download</ToastAction>,
        });
      } else {
        toast({
          title: "Label Generation Failed",
          description: "Failed to generate label in the selected format.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error purchasing shipping label:", error);
      toast({
        title: "Purchase Error",
        description: error.message || "Failed to purchase shipping label. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const onLabelGenerated = (labelUrl: string, trackingCode: string, shipmentDetails: any, shipmentId: string, labelUrls?: { pdf?: string; png?: string; zpl?: string; epl?: string }) => {
    console.log('Label generated:', { labelUrl, trackingCode, shipmentId, labelUrls });
    setGeneratedLabelUrl(labelUrl);
    setTrackingCode(trackingCode);
    setCurrentShipmentId(shipmentId);
    setAvailableLabelUrls(labelUrls || { png: labelUrl });


    const previewData: SingleShipmentDataForPreview = {
      id: shipmentId,
      label_url: labelUrls?.png || labelUrl,
      label_urls: labelUrls,
      tracking_code: trackingCode,
      carrier: shipmentDetails?.carrier,
      service: shipmentDetails?.service,
      details: {
        // Assuming shipmentDetails contains to_address and from_address
        // You might need to map them from your specific structure
        to_address: shipmentDetails.to_address, 
        // from_address: shipmentDetails.from_address, 
      }
    };
    setShipmentDataForPreview(previewData);
    setShowPrintPreview(true);

    toast({
      title: "Label Generated!",
      description: `Tracking: ${trackingCode}`,
      action: <ToastAction altText="Download" onClick={() => downloadLabel(labelUrl, 'label.png')}>Download</ToastAction>,
    });
  };

  const handleRateSelect = async (rate: ShippingOption) => {
    setSelectedRate(rate);
    setIsPurchasing(true);

    try {
      const purchaseResult = await purchaseShippingLabel(rate.id);
      console.log('Purchase result:', purchaseResult);

      if (purchaseResult && purchaseResult.label_url) {
        setGeneratedLabelUrl(purchaseResult.label_url);
        setTrackingCode(purchaseResult.tracking_code);
        setCurrentShipmentId(purchaseResult.id);
        setAvailableLabelUrls({ png: purchaseResult.label_url, pdf: purchaseResult.label_url, zpl: purchaseResult.label_url });

        onLabelGenerated(purchaseResult.label_url, purchaseResult.tracking_code, {
          to_address: toAddress,
          from_address: fromAddress,
          carrier: rate.carrier,
          service: rate.service,
        }, purchaseResult.id, { png: purchaseResult.label_url, pdf: purchaseResult.label_url, zpl: purchaseResult.label_url });

      } else {
        toast({
          title: "Label Purchase Failed",
          description: "Failed to purchase shipping label.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error purchasing shipping label:", error);
      toast({
        title: "Purchase Error",
        description: error.message || "Failed to purchase shipping label. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };
  
  const handlePreviewDownloadFormat = async (format: LabelFormat, shipmentId?: string) => {
    if (!shipmentId || !shipmentDataForPreview) {
        toast({ title: "Error", description: "Shipment data not available for download.", variant: "destructive" });
        return;
    }
    let urlToDownload: string | undefined;
    switch (format) {
        case 'pdf': urlToDownload = shipmentDataForPreview.label_urls?.pdf; break;
        case 'png': urlToDownload = shipmentDataForPreview.label_urls?.png || shipmentDataForPreview.label_url; break;
        case 'zpl': urlToDownload = shipmentDataForPreview.label_urls?.zpl; break;
        case 'epl': urlToDownload = shipmentDataForPreview.label_urls?.epl; break;
        default:
            toast({ title: "Unsupported Format", description: `Format ${format} is not available for download.`, variant: "destructive" });
            return;
    }

    if (urlToDownload) {
        await downloadLabel(urlToDownload, `label_${shipmentDataForPreview.tracking_code || shipmentId}.${format}`);
    } else {
        toast({ title: "Label Not Found", description: `${format.toUpperCase()} label not available for this shipment.`, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardBody>
        <h2 className="text-lg font-semibold mb-4">Shipping Rates</h2>
        {isLoading ? (
          <p>Loading shipping rates...</p>
        ) : rates.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Carrier</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.carrier}</TableCell>
                    <TableCell>{rate.service}</TableCell>
                    <TableCell>{rate.rate} {rate.currency}</TableCell>
                    <TableCell>{rate.delivery_days}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleRateSelect(rate)} disabled={isPurchasing}>
                        {isPurchasing ? "Purchasing..." : "Purchase"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No shipping rates available for the given address and parcel details.</p>
        )}
        {generatedLabelUrl && (
          <div className="mt-4">
            <h3 className="text-md font-semibold">Label Generated!</h3>
            <p>Tracking Code: {trackingCode}</p>
            <Button variant="secondary" onClick={() => downloadLabel(generatedLabelUrl, 'shipping_label.png')}>
              Download Label
            </Button>
            <div className="flex mt-2">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => handleFormatChange('png')}
                disabled={isPurchasing}
              >
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => handleFormatChange('pdf')}
                disabled={isPurchasing}
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => handleFormatChange('zpl')}
                disabled={isPurchasing}
              >
                ZPL
              </Button>
            </div>
          </div>
        )}
      </CardBody>

      {showPrintPreview && shipmentDataForPreview && fromAddress && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          singleShipmentPreview={shipmentDataForPreview}
          isBatchPreview={false}
          onDownloadFormat={handlePreviewDownloadFormat}
          pickupAddress={fromAddress}
        />
      )}
    </Card>
  );
};

export default ShippingRates;
