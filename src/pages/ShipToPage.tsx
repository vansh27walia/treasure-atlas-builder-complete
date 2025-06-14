import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form'; // Added FormProvider
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast"; // Corrected import from ui/toast
import AddressForm from '@/components/shipping/AddressForm';
import PackageForm from '@/components/shipping/PackageForm';
import ShippingRates from '@/components/ShippingRates'; // Corrected import path
import { AddressDetails, ParcelDetails, SavedAddress, LabelFormat, ShippingOption } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';
import { supabase } from '@/integrations/supabase/client';

// ... keep existing code (schemas: addressSchema, packageSchema, combinedSchema, FormData type)
const addressSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  company: z.string().optional(),
  street1: z.string().min(5, { message: "Street address must be at least 5 characters." }),
  street2: z.string().optional(),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP code." }),
  country: z.string().min(2, { message: "Country code must be 2 characters."}),
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  
  const [generatedLabelUrl, setGeneratedLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [currentShipmentId, setCurrentShipmentId] = useState<string | null>(null);
  
  const [defaultFromAddress, setDefaultFromAddress] = useState<SavedAddress | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      toAddress: { name: '', company: '', street1: '', street2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
      fromAddress: { name: '', company: '', street1: '', street2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
      parcel: { length: 6, width: 6, height: 4, weight: 1 },
    },
  });

  useEffect(() => {
    const fetchDefaultFromAddress = async () => {
      setIsLoading(true);
      try {
        const addrFromService = await addressService.getDefaultFromAddress();
        if (addrFromService) {
          const adaptedAddr: SavedAddress = {
            ...addrFromService,
            id: String(addrFromService.id), // Map id to string
            name: addrFromService.name || '', // Ensure required fields are present
            street1: addrFromService.street1,
            city: addrFromService.city,
            state: addrFromService.state,
            zip: addrFromService.zip,
            country: addrFromService.country,
          };
          form.setValue("fromAddress", {
            name: adaptedAddr.name || '',
            company: adaptedAddr.company || '',
            street1: adaptedAddr.street1,
            street2: adaptedAddr.street2 || '',
            city: adaptedAddr.city,
            state: adaptedAddr.state,
            zip: adaptedAddr.zip,
            country: adaptedAddr.country,
            phone: adaptedAddr.phone || '',
            email: adaptedAddr.email || '',
          });
          setDefaultFromAddress(adaptedAddr);
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
    setIsLoading(true);

    try {
      console.log("Purchasing label for rate:", rate.id, "shipmentId:", currentShipmentId);
      const labelOptions = { label_format: "PNG", label_size: "4x6" }; 

      const { data: labelData, error: labelError } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: currentShipmentId, 
          rateId: rate.id,
          options: labelOptions
        }
      });

      if (labelError) throw labelError;
      if (!labelData || (!labelData.labelUrl && !labelData.label_urls)) {
        throw new Error("Label data not returned from server.");
      }
      
      console.log("Label purchase result:", labelData);

      const primaryLabelUrl = labelData.label_urls?.png || labelData.labelUrl || labelData.label_urls?.pdf;
      setGeneratedLabelUrl(primaryLabelUrl);
      setTrackingCode(labelData.trackingCode);
      
      const formDataValues = form.getValues();
      // Ensure formDataValues.toAddress conforms to AddressDetails
      const toAddressDetails: AddressDetails = {
        name: formDataValues.toAddress.name || '',
        company: formDataValues.toAddress.company,
        street1: formDataValues.toAddress.street1 || '',
        street2: formDataValues.toAddress.street2,
        city: formDataValues.toAddress.city || '',
        state: formDataValues.toAddress.state || '',
        zip: formDataValues.toAddress.zip || '',
        country: formDataValues.toAddress.country || 'US',
        phone: formDataValues.toAddress.phone,
        email: formDataValues.toAddress.email,
      };

      const previewData: SingleShipmentDataForPreview = {
        id: currentShipmentId,
        label_url: primaryLabelUrl,
        label_urls: labelData.label_urls || { png: primaryLabelUrl },
        tracking_code: labelData.trackingCode,
        carrier: rate.carrier,
        service: rate.service,
        details: {
          to_address: toAddressDetails,
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
  
  const downloadLabel = async (url: string, filename: string) => {
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

  if (isLoading && !isLoadingRates) { 
    return <div>Purchasing Label...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <FormProvider {...form}> {/* Added FormProvider */}
        <Card>
          <CardHeader>
            <CardTitle>Create Single Shipment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <AddressForm addressType="toAddress" title="To Address" />
              <AddressForm addressType="fromAddress" title="From Address" />
              <PackageForm form={form} /> {/* PackageForm might need FormProvider too, or pass form explicitly */}
              <Button type="submit" disabled={isLoadingRates || isLoading}>
                {isLoadingRates ? 'Getting Rates...' : 'Get Rates'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      {rates.length > 0 && (
        <div className="mt-6">
          <ShippingRates
            rates={rates}
            isLoadingRates={isLoadingRates}
            onRateSelected={handleRateSelectedForPurchase}
            fromAddress={defaultFromAddress}
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
          pickupAddress={defaultFromAddress} // Ensure this matches expected type in PrintPreview
        />
      )}
    </div>
  );
};

export default ShipToPage;
