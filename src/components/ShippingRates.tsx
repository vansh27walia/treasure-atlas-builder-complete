import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { AddressDetails, ParcelDetails, ShippingOption, SavedAddress, LabelFormat } from '@/types/shipping';
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';

interface ShippingRatesProps {
  shipmentDetails?: {
    to_address: AddressDetails;
    from_address: AddressDetails;
    parcel: ParcelDetails;
    customs_info?: any;
    options?: any;
  };
  rates: ShippingOption[];
  isLoadingRates: boolean;
  onRateSelected: (rate: ShippingOption) => void;
  fromAddress?: SavedAddress | null; 
  toAddress?: AddressDetails;
  parcel?: ParcelDetails;
  customsInfo?: any;
  options?: any;
}


const ShippingRates: React.FC<ShippingRatesProps> = ({ 
  rates,
  isLoadingRates,
  onRateSelected,
  fromAddress,
 }) => {
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string>('');
  const [currentShipmentId, setCurrentShipmentId] = useState<string>('');
  const [availableLabelUrls, setAvailableLabelUrls] = useState<{ pdf?: string; png?: string; zpl?: string; epl?: string }>({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { toast } = useToast();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);

  const downloadLabel = (labelUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRateSelectInternal = async (rate: ShippingOption) => {
    setSelectedRate(rate);
    setIsPurchasing(true);
    try {
      onRateSelected(rate);
    } catch (error: any) {
        console.error("Error during onRateSelected callback:", error);
        toast({
          title: "Selection Error",
          description: "Failed to process rate selection.",
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
      <CardHeader>
        <CardTitle>Available Shipping Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingRates ? (
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
                    <TableCell>{rate.delivery_days ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleRateSelectInternal(rate)} 
                        disabled={isPurchasing || (selectedRate?.id === rate.id && isPurchasing)}
                      >
                        {selectedRate?.id === rate.id && isPurchasing ? "Processing..." : "Select Rate"}
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
      </CardContent>

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
