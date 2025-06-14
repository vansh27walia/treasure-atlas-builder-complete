import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, useToast, ToastAction } from "@/components/ui/use-toast";
import { AddressForm } from '@/components/shipping/AddressForm';
import { PackageForm } from '@/components/shipping/PackageForm';
import ShippingRates from '@/components/shipping/ShippingRates';
import { AddressDetails, ParcelDetails, SavedAddress, LabelFormat } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
import { useSession } from 'next-auth/react';
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';
// import { getLabelImage } from '@/lib/utils'; // Removed as getLabelImage is not used/exported

const addressSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  company: z.string().optional(),
  street1: z.string().min(5, { message: "Street address must be at least 5 characters." }),
  street2: z.string().optional(),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP code." }),
  country: z.string(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
});

const packageSchema = z.object({
  length: z.number().min(1, { message: "Length must be at least 1 inch." }),
  width: z.number().min(1, { message: "Width must be at least 1 inch." }),
  height: z.number().min(1, { message: "Height must be at least 1 inch." }),
  weight: z.number().min(0.1, { message: "Weight must be at least 0.1 lbs." }),
});

const combinedSchema = z.object({
  toAddress: addressSchema,
  fromAddress: addressSchema,
  parcel: packageSchema,
});

type FormData = z.infer<typeof combinedSchema>;

const ShipToPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [currentShipmentId, setCurrentShipmentId] = useState<string | null>(null);
  const [labelUrls, setLabelUrls] = useState<{ pdf?: string; png?: string; zpl?: string; epl?: string }>({});
  const [availableLabelUrls, setAvailableLabelUrls] = useState<{ pdf?: string; png?: string; zpl?: string; epl?: string }>({});
  const [defaultFromAddress, setDefaultFromAddress] = useState<SavedAddress | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);
  const [selectedLabelFormatForPreview, setSelectedLabelFormatForPreview] = useState<LabelFormat>('png');


  const form = useForm<FormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      toAddress: {
        name: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        email: '',
      },
      fromAddress: {
        name: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        email: '',
      },
      parcel: {
        length: 6,
        width: 6,
        height: 4,
        weight: 1,
      },
    },
  });

  useEffect(() => {
    const fetchDefaultFromAddress = async () => {
      setIsLoading(true);
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
          form.setValue("fromAddress", {
            name: address.name || '',
            company: address.company || '',
            street1: address.street1,
            street2: address.street2 || '',
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country,
            phone: address.phone || '',
            email: address.email || '',
          });
          setDefaultFromAddress(address);
        }
      } catch (error) {
        console.error("Error fetching default 'from' address:", error);
        toast({
          title: "Error",
          description: "Failed to load default 'from' address.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefaultFromAddress();
  }, [form, session, toast]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setRates(null);
    setSelectedRate(null);
    setGeneratedLabelUrl(null);
    setTrackingCode(null);

    try {
      const toAddress: AddressDetails = {
        name: data.toAddress.name,
        company: data.toAddress.company,
        street1: data.toAddress.street1,
        street2: data.toAddress.street2,
        city: data.toAddress.city,
        state: data.toAddress.state,
        zip: data.toAddress.zip,
        country: data.toAddress.country,
        phone: data.toAddress.phone,
        email: data.toAddress.email,
      };

      const fromAddress: AddressDetails = {
        name: data.fromAddress.name,
        company: data.fromAddress.company,
        street1: data.fromAddress.street1,
        street2: data.fromAddress.street2,
        city: data.fromAddress.city,
        state: data.fromAddress.state,
        zip: data.fromAddress.zip,
        country: data.fromAddress.country,
        phone: data.fromAddress.phone,
        email: data.fromAddress.email,
      };

      const parcel: ParcelDetails = {
        length: data.parcel.length,
        width: data.parcel.width,
        height: data.parcel.height,
        weight: data.parcel.weight,
      };

      const shipmentDetails = {
        to_address: toAddress,
        from_address: fromAddress,
        parcel: parcel,
      };

      setRates(shipmentDetails);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit form.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelected = (rate: any) => {
    setSelectedRate(rate);
  };

  const handleLabelGenerated = async (labelUrl: string, trackingCode: string, shipmentDetails: any, shipmentId: string, labelUrls?: { pdf?: string; png?: string; zpl?: string; epl?: string }) => {
    console.log("Label generated in ShipToPage:", { labelUrl, trackingCode, shipmentId, labelUrls });
    setGeneratedLabelUrl(labelUrl);
    setTrackingCode(trackingCode);
    setCurrentShipmentId(shipmentId); // Store shipmentId
    setLabelUrls(labelUrls || { png: labelUrl });


    const previewData: SingleShipmentDataForPreview = {
      id: shipmentId,
      label_url: labelUrls?.png || labelUrl,
      label_urls: labelUrls,
      tracking_code: trackingCode,
      carrier: shipmentDetails?.carrier,
      service: shipmentDetails?.service,
      details: {
        to_address: formData.toAddress || shipmentDetails.to_address, // Assuming formData.toAddress is AddressDetails
        // from_address: formData.fromAddress, // Assuming formData.fromAddress is AddressDetails
      },
    };
    setShipmentDataForPreview(previewData);
    setShowPrintPreview(true);

    toast({
      title: "Label Generated Successfully!",
      description: `Tracking Code: ${trackingCode}`,
      action: (
        <ToastAction altText="Download Label" onClick={() => downloadLabel(labelUrl, `label_${trackingCode}.png`)}>
          Download
        </ToastAction>
      ),
    });
  };

  const downloadLabel = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast({
        title: "Error",
        description: "Failed to download label.",
        variant: "destructive",
      });
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedLabelFormatForPreview(format as LabelFormat);
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


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Ship To</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddressForm form={form} addressType="toAddress" title="To Address" />
            <AddressForm form={form} addressType="fromAddress" title="From Address" />
            <PackageForm form={form} />
            <Button type="submit" disabled={isLoading}>
              Get Rates
            </Button>
          </form>
        </CardContent>
      </Card>

      {rates && (
        <ShippingRates
          shipmentDetails={rates}
          onRateSelected={handleRateSelected}
          onLabelGenerated={handleLabelGenerated}
          fromAddress={defaultFromAddress}
        />
      )}

      {showPrintPreview && shipmentDataForPreview && defaultFromAddress && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          singleShipmentPreview={shipmentDataForPreview}
          isBatchPreview={false}
          onDownloadFormat={handlePreviewDownloadFormat}
          pickupAddress={defaultFromAddress} // Assuming defaultFromAddress is SavedAddress
        />
      )}
    </div>
  );
};

export default ShipToPage;
