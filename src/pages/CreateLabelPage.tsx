import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import AddressForm from '@/components/shipping/AddressForm';
import PackageForm from '@/components/shipping/PackageForm';
import ShippingRates from '@/components/ShippingRates'; // Corrected import path
import PrintPreview, { SingleShipmentDataForPreview } from '@/components/shipping/PrintPreview';
import { AddressDetails, ParcelDetails, SavedAddress, ShippingOption, LabelFormat } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
import { useForm, FormProvider } from 'react-hook-form'; // Added FormProvider
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { ToastAction } from "@/components/ui/toast";

const addressSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  company: z.string().optional(),
  street1: z.string().min(5, { message: "Street address must be at least 5 characters." }),
  street2: z.string().optional(),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Invalid ZIP code." }),
  country: z.string().min(2, { message: "Country code must be 2 characters."}), // Ensure country is also validated
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


const CreateLabelPage: React.FC = () => {
  const { toast } = useToast();
  const [defaultFromAddress, setDefaultFromAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [currentShipmentIdForLabel, setCurrentShipmentIdForLabel] = useState<string | null>(null);
  
  const [shipmentDataForPreview, setShipmentDataForPreview] = useState<SingleShipmentDataForPreview | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      toAddress: { name: '', company: '', street1: '', street2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
      fromAddress: { name: '', company: '', street1: '', street2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
      parcel: { length: 6, width: 4, height: 2, weight: 1 },
    },
  });

  useEffect(() => {
    const fetchDefault = async () => {
      try {
        const addrFromService = await addressService.getDefaultFromAddress();
        if (addrFromService) {
          const adaptedAddr: SavedAddress = {
            ...addrFromService,
            id: String(addrFromService.id), // Map id to string
            // Ensure all AddressDetails fields are present if SavedAddress extends it
            name: addrFromService.name || '',
            street1: addrFromService.street1,
            city: addrFromService.city,
            state: addrFromService.state,
            zip: addrFromService.zip,
            country: addrFromService.country,
          };
          setDefaultFromAddress(adaptedAddr);
          form.reset({ 
            ...form.getValues(), 
            fromAddress: {
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
            }
          });
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load default from address.", variant: "destructive" });
      }
    };
    fetchDefault();
  }, [form, toast]);

  const handleGetRates = async (formDataValues: FormData) => {
    setIsLoadingRates(true);
    setRates([]);
    setSelectedRate(null);
    setCurrentShipmentIdForLabel(null);
    setShipmentDataForPreview(null);
    try {
      const payload = {
        to_address: formDataValues.toAddress,
        from_address: formDataValues.fromAddress,
        parcel: formDataValues.parcel,
      };
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', { body: payload });
      if (error) throw error;
      setRates(data.rates as ShippingOption[]);
      setCurrentShipmentIdForLabel(data.shipmentId || null);
    } catch (error: any) {
      toast({ title: "Error fetching rates", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleRateSelectedAndPurchase = async (rate: ShippingOption) => {
    if (!currentShipmentIdForLabel) {
      toast({ title: "Error", description: "Shipment ID missing.", variant: "destructive" });
      return;
    }
    setSelectedRate(rate);
    setIsLoading(true);
    try {
      const labelOptions = { label_format: "PNG", label_size: "4x6" };
      const { data: labelGenData, error: labelGenError } = await supabase.functions.invoke('create-label', {
        body: {
          shipmentId: currentShipmentIdForLabel,
          rateId: rate.id,
          options: labelOptions,
        },
      });
      if (labelGenError) throw labelGenError;
      
      const primaryUrl = labelGenData.label_urls?.png || labelGenData.labelUrl || labelGenData.label_urls?.pdf;
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
        id: currentShipmentIdForLabel,
        label_url: primaryUrl,
        label_urls: labelGenData.label_urls || { png: primaryUrl },
        tracking_code: labelGenData.trackingCode,
        carrier: rate.carrier,
        service: rate.service,
        details: { to_address: toAddressDetails },
      };
      setShipmentDataForPreview(previewData);
      setShowPrintPreview(true);

      toast({ title: "Label Generated", description: `Tracking: ${labelGenData.trackingCode}`, 
        action: primaryUrl ? <ToastAction altText="Download" onClick={() => downloadLabel(primaryUrl, `label_${labelGenData.trackingCode}.png`)}>Download</ToastAction> : undefined
      });

    } catch (error: any) {
      toast({ title: "Error purchasing label", description: error.message, variant: "destructive" });
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

  return (
    <div className="container mx-auto p-6">
      <FormProvider {...form}> {/* Added FormProvider */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader><CardTitle>Create Shipping Label</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleGetRates)} className="space-y-6">
              <AddressForm addressType="fromAddress" title="From Address" />
              <AddressForm addressType="toAddress" title="To Address" />
              <PackageForm form={form} /> {/* PackageForm might need FormProvider too, or pass form explicitly */}
              <Button type="submit" disabled={isLoadingRates || isLoading}>
                {isLoadingRates ? 'Getting Rates...' : 'Get Shipping Rates'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      {rates.length > 0 && (
        <div className="mt-8">
          <ShippingRates
            rates={rates}
            isLoadingRates={isLoadingRates}
            onRateSelected={handleRateSelectedAndPurchase}
            fromAddress={defaultFromAddress}
            // Ensure toAddress and parcel are correctly typed if passed
            // For example, ensure they meet AddressDetails and ParcelDetails from shipping.ts
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

export default CreateLabelPage;
