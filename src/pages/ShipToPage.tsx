import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from next/router
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep if used directly, or remove
import { Label } from '@/components/ui/label'; // Keep if used directly, or remove
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast"; // Corrected path for useToast
import { ToastAction } from "@/components/ui/toast"; // Corrected import for ToastAction
import AddressForm from '@/components/shipping/AddressForm'; // Changed to default import
import PackageForm from '@/components/shipping/PackageForm'; // Uses the new placeholder
import ShippingRates from '@/components/shipping/ShippingRates'; // Path should be okay
import { AddressDetails, ParcelDetails, SavedAddress, LabelFormat, ShippingOption } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
// import { useSession } from 'next-auth/react'; // Removed next-auth as it's not standard React
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';
import { supabase } from '@/integrations/supabase/client'; // For calling Supabase functions

// ... keep existing code (schemas: addressSchema, packageSchema, combinedSchema, FormData type)
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
  const navigate = useNavigate(); // Changed from useRouter
  const { toast } = useToast();
  // const { data: session } = useSession(); // Removed
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rates, setRates] = useState<ShippingOption[]>([]); // Store fetched rates
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  
  // Label related state
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [currentShipmentId, setCurrentShipmentId] = useState<string | null>(null);
  // const [labelUrls, setLabelUrls] = useState<{ pdf?: string; png?: string; zpl?: string; epl?: string }>({}); // replaced by shipmentDataForPreview.label_urls
  
  const [defaultFromAddress, setDefaultFromAddress] = useState<SavedAddress | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);
  // const [selectedLabelFormatForPreview, setSelectedLabelFormatForPreview] = useState<LabelFormat>('png'); // Managed by PrintPreview or not needed here

  const form = useForm<FormData>({
        // ... keep existing code (form defaultValues)
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
  }, [form, toast]);

  const onSubmit = async (data: FormData) => {
    // This function will now fetch rates
    setIsLoadingRates(true);
    setRates([]); // Clear previous rates
    setSelectedRate(null);
    setGeneratedLabelUrl(null);
    setTrackingCode(null);
    setCurrentShipmentId(null);
    setShipmentDataForPreview(null);

    try {
      const shipmentDetailsPayload = {
        to_address: data.toAddress,
        from_address: data.fromAddress,
        parcel: data.parcel,
      };
      
      console.log("Fetching rates with payload:", shipmentDetailsPayload);
      const { data: ratesData, error: ratesError } = await supabase.functions.invoke('get-shipping-rates', {
        body: shipmentDetailsPayload
      });

      if (ratesError) throw ratesError;
      if (!ratesData || !ratesData.rates) throw new Error("No rates returned from function.");

      console.log("Rates received:", ratesData.rates);
      setRates(ratesData.rates as ShippingOption[]);
      setCurrentShipmentId(ratesData.shipmentId || null); // Store shipment ID from rates response

    } catch (error: any) {
      console.error("Error fetching rates:", error);
      toast({
        title: "Error Fetching Rates",
        description: error.message || "Failed to fetch shipping rates.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleRateSelectedForPurchase = async (rate: ShippingOption) => {
    if (!currentShipmentId) {
      toast({ title: "Error", description: "Shipment ID not found. Cannot purchase label.", variant: "destructive" });
      return;
    }
    setSelectedRate(rate);
    setIsLoading(true); // General loading for purchase

    try {
      console.log("Purchasing label for rate:", rate.id, "shipmentId:", currentShipmentId);
      // Default to PDF, 4x6 for single label purchase if not specified
      const labelOptions = { label_format: "PNG", label_size: "4x6" }; 

      const { data: labelData, error: labelError } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: currentShipmentId, 
          rateId: rate.id,
          options: labelOptions
        }
      });

      if (labelError) throw labelError;
      if (!labelData || (!labelData.labelUrl && !labelData.label_urls)) { // Check for label_urls too
        throw new Error("Label data not returned from server.");
      }
      
      console.log("Label purchase result:", labelData);

      const primaryLabelUrl = labelData.label_urls?.png || labelData.labelUrl || labelData.label_urls?.pdf;
      setGeneratedLabelUrl(primaryLabelUrl);
      setTrackingCode(labelData.trackingCode);
      // setCurrentShipmentId is already set from rate fetching
      
      const formData = form.getValues();
      const previewData: SingleShipmentDataForPreview = {
        id: currentShipmentId,
        label_url: primaryLabelUrl, // Primary URL for quick preview
        label_urls: labelData.label_urls || { png: primaryLabelUrl }, // All available formats
        tracking_code: labelData.trackingCode,
        carrier: rate.carrier,
        service: rate.service,
        details: {
          to_address: formData.toAddress,
          // from_address: formData.fromAddress, // Can be added if needed by PrintPreview
        },
      };
      setShipmentDataForPreview(previewData);
      setShowPrintPreview(true);

      toast({
        title: "Label Generated Successfully!",
        description: `Tracking Code: ${labelData.trackingCode}`,
        action: primaryLabelUrl ? (
          <ToastAction altText="Download Label" onClick={() => downloadLabel(primaryLabelUrl, `label_${labelData.trackingCode}.png`)}>
            Download
          </ToastAction>
        ) : undefined,
      });

    } catch (error: any) {
      console.error("Error purchasing label:", error);
      toast({
        title: "Label Purchase Error",
        description: error.message || "Failed to purchase shipping label.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // handleLabelGenerated is effectively replaced by logic within handleRateSelectedForPurchase

  const downloadLabel = async (url: string, filename: string) => {
    // ... keep existing code (downloadLabel)
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch label: ${response.statusText}`);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error downloading label:", error);
      toast({
        title: "Error",
        description: `Failed to download label: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // handleFormatChange removed, label format decided at purchase or managed by PrintPreview if re-fetching
  
  const handlePreviewDownloadFormat = async (format: LabelFormat, shipmentId?: string) => {
    // ... keep existing code (handlePreviewDownloadFormat)
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

  if (isLoading && !isLoadingRates) { // General loading, not for rates specifically
    return <div>Purchasing Label...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Single Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AddressForm form={form} addressType="toAddress" title="To Address" />
            <AddressForm form={form} addressType="fromAddress" title="From Address" />
            <PackageForm form={form} />
            <Button type="submit" disabled={isLoadingRates || isLoading}>
              {isLoadingRates ? 'Getting Rates...' : 'Get Rates'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <div className="mt-6">
          <ShippingRates
            // shipmentDetails is no longer needed as rates are passed directly
            rates={rates}
            isLoadingRates={isLoadingRates}
            onRateSelected={handleRateSelectedForPurchase}
            fromAddress={defaultFromAddress} // For PrintPreview context
            // Pass toAddress and parcel if ShippingRates needs them for display purposes
            toAddress={form.getValues("toAddress")}
            parcel={form.getValues("parcel")}
          />
        </div>
      )}

      {showPrintPreview && shipmentDataForPreview && defaultFromAddress && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          singleShipmentPreview={shipmentDataForPreview}
          isBatchPreview={false}
          onDownloadFormat={handlePreviewDownloadFormat}
          pickupAddress={defaultFromAddress}
        />
      )}
    </div>
  );
};

export default ShipToPage;
