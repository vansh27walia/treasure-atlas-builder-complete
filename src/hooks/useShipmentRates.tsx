import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { BulkShipment, BulkUploadResult, Rate } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';

export const useShipmentRates = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  
  // Always use the freshest results to avoid stale overwrites after edits
  const latestResultsRef = useRef(initialResults);
  useEffect(() => {
    latestResultsRef.current = initialResults;
  }, [initialResults]);
  const fetchAllShipmentRates = async (shipments: BulkShipment[]) => {
    setIsFetchingRates(true);
    
    try {
      const updatedShipments: BulkShipment[] = [...shipments];
      let successCount = 0;
      
      for (let i = 0; i < updatedShipments.length; i++) {
        const shipment = updatedShipments[i];
        
        try {
          // Update status to show we're processing this shipment
          updatedShipments[i] = { ...shipment, status: 'pending_rates' as const };
          updateResults({
            ...(latestResultsRef.current as BulkUploadResult),
            processedShipments: updatedShipments
          });
          
          // Fetch real rates for this shipment using CarrierService
          const rates = await fetchShipmentRates(shipment);
          
          // Update shipment with rates (sorted by lowest price)
          const sortedRates = [...rates].sort((a, b) => {
            const ar = typeof a.rate === 'string' ? parseFloat(a.rate as any) : a.rate;
            const br = typeof b.rate === 'string' ? parseFloat(b.rate as any) : b.rate;
            return ar - br;
          });
          const cheapestRate = sortedRates.length > 0 ? sortedRates[0] : null;
          
          updatedShipments[i] = { 
            ...shipment, 
            availableRates: sortedRates,
            status: 'rates_fetched' as const,
            // Always default to the cheapest option after fetching
            selectedRateId: cheapestRate?.id,
            carrier: cheapestRate?.carrier || '',
            service: cheapestRate?.service || '',
            rate: cheapestRate?.rate || 0,
            easypost_id: cheapestRate?.shipment_id || null
          };
          
          successCount++;
        } catch (error) {
          console.error(`Error fetching rates for shipment ${shipment.id}:`, error);
          updatedShipments[i] = { 
            ...shipment, 
            status: 'error' as const,
            error: 'Failed to fetch shipping rates' 
          };
        }
        
        // Update UI with progress
        updateResults({
          ...(latestResultsRef.current as BulkUploadResult),
          processedShipments: updatedShipments
        });
      }
      
      toast.success(`Successfully fetched rates for ${successCount} out of ${shipments.length} shipments`);
      return updatedShipments;
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      toast.error('Failed to fetch rates for some shipments');
      return shipments;
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  const fetchShipmentRates = async (shipment: BulkShipment): Promise<Rate[]> => {
    try {
      console.log('Fetching rates via Supabase for shipment:', shipment.id);
      const results = latestResultsRef.current;
      if (!results?.pickupAddress) {
        throw new Error('Missing pickup address for rate fetch');
      }

      const from = results.pickupAddress;
      const d: any = shipment.details || {};

      const toAddress = d.to_address ?? {
        name: d.to_name || shipment.recipient || shipment.customer_name || '',
        company: d.to_company || shipment.customer_company || '',
        street1: d.to_street1 || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).street1 : ''),
        street2: d.to_street2 || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).street2 : ''),
        city: d.to_city || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).city : ''),
        state: d.to_state || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).state : ''),
        zip: d.to_zip || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).zip : ''),
        country: d.to_country || (typeof shipment.customer_address === 'object' ? (shipment.customer_address as any).country : 'US'),
        phone: d.to_phone || shipment.customer_phone || '',
        email: d.to_email || shipment.customer_email || ''
      };

      const parcel = {
        length: d.parcel_length ?? d.length ?? 12,
        width: d.parcel_width ?? d.width ?? 8,
        height: d.parcel_height ?? d.height ?? 4,
        weight: d.parcel_weight ?? d.weight ?? 16,
      };

      const payload = {
        fromAddress: {
          name: from.name || from.company || '',
          company: from.company || '',
          street1: from.street1,
          street2: from.street2 || '',
          city: from.city,
          state: from.state,
          zip: from.zip,
          country: from.country || 'US',
          phone: from.phone || '',
          email: from.email || ''
        },
        toAddress,
        parcel,
        // Pass insured value (declared value) only when insurance is enabled server-side
        insurance: (d as any).insurance_enabled === false
          ? undefined
          : (typeof d.declared_value === 'number' && d.declared_value > 0 ? d.declared_value : undefined),
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', { body: payload });
      if (error) {
        console.error('Supabase get-shipping-rates error:', error);
        throw new Error(error.message || 'Failed to fetch rates');
      }

      const apiRates = (data?.rates || []) as any[];
      const normalized: Rate[] = apiRates.map((r: any) => ({
        id: r.id,
        easypost_rate_id: r.id,
        carrier: r.carrier,
        service: r.service,
        rate: typeof r.rate === 'string' ? parseFloat(r.rate) : r.rate,
        currency: r.currency || 'USD',
        delivery_days: r.delivery_days ?? r.est_delivery_days ?? null,
        shipment_id: r.shipment_id,
        retail_rate: r.retail_rate,
        list_rate: r.list_rate,
      }));

      return normalized;
    } catch (error) {
      console.error('Error fetching real shipment rates:', error);
      throw new Error('Failed to fetch shipping rates from API');
    }
  };
  
  const handleSelectRate = (shipmentId: string, rateId: string) => {
    const latest = latestResultsRef.current;
    if (!latest) return;
    
    const updatedShipments = latest.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.availableRates?.find((rate: any) => rate.id === rateId);
        return { 
          ...shipment, 
          selectedRateId: rateId,
          carrier: selectedRate?.carrier || shipment.carrier,
          service: selectedRate?.service || shipment.service,
          rate: parseFloat(String(selectedRate?.rate ?? shipment.rate ?? 0)),
          easypost_id: (selectedRate as any)?.shipment_id || shipment.easypost_id,
        };
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (parseFloat(String(selectedRate?.rate ?? 0)) || 0);
    }, 0);
    
    updateResults({
      ...(latest as BulkUploadResult),
      processedShipments: updatedShipments,
      totalCost
    });
  };
  
  const handleRefreshRates = async (shipmentId: string) => {
    const latest = latestResultsRef.current;
    if (!latest) return;
    
    const existing = latest.processedShipments.find(s => s.id === shipmentId);
    if (!existing) return;
    
    const updatedShipments = latest.processedShipments.map(s => 
      s.id === shipmentId ? { ...s, status: 'pending_rates' as const } : s
    );
    
    updateResults({
      ...(latest as BulkUploadResult),
      processedShipments: updatedShipments
    });
    
    try {
      const rates = await fetchShipmentRates(existing);
      const sortedRates = [...rates].sort((a, b) => {
        const ar = typeof a.rate === 'string' ? parseFloat(a.rate as any) : a.rate;
        const br = typeof b.rate === 'string' ? parseFloat(b.rate as any) : b.rate;
        return ar - br;
      });
      const cheapest = sortedRates.length > 0 ? sortedRates[0] : undefined;
      const finalShipments = updatedShipments.map(s =>
        s.id === shipmentId
          ? {
              ...s,
              availableRates: sortedRates,
              status: 'rates_fetched' as const,
              selectedRateId: cheapest?.id,
              easypost_id: cheapest?.shipment_id || s.easypost_id,
              carrier: cheapest?.carrier || s.carrier,
              service: cheapest?.service || s.service,
              rate: cheapest?.rate ?? s.rate ?? 0,
            }
          : s
      );
      
      updateResults({
        ...(latest as BulkUploadResult),
        processedShipments: finalShipments
      });
      
      toast.success('Rates updated successfully');
    } catch (error) {
      const errorShipments = updatedShipments.map(s =>
        s.id === shipmentId
          ? { ...s, status: 'error' as const, error: 'Failed to refresh rates' }
          : s
      );
      
      updateResults({
        ...(latest as BulkUploadResult),
        processedShipments: errorShipments
      });
      
      toast.error('Failed to update rates');
    }
  };
  
  // Refresh rates right after a shipment edit using the freshly updated data
  const handleRefreshRatesAfterEdit = async (updatedShipment: BulkShipment) => {
    const latest = latestResultsRef.current;
    if (!latest) return;
    setIsFetchingRates(true);

    try {
      const rates = await fetchShipmentRates(updatedShipment);
      const sortedRates = [...rates].sort((a, b) => {
        const ar = typeof a.rate === 'string' ? parseFloat(a.rate as any) : a.rate;
        const br = typeof b.rate === 'string' ? parseFloat(b.rate as any) : b.rate;
        return ar - br;
      });
      const cheapest = sortedRates.length > 0 ? sortedRates[0] : undefined;

      const updatedShipments = latest.processedShipments.map(s =>
        s.id === updatedShipment.id
          ? {
              ...updatedShipment,
              availableRates: sortedRates,
              status: 'rates_fetched' as const,
              // Always default to cheapest after edit per request
              selectedRateId: cheapest?.id,
              easypost_id: cheapest?.shipment_id || updatedShipment.easypost_id,
              carrier: cheapest?.carrier || updatedShipment.carrier,
              service: cheapest?.service || updatedShipment.service,
              rate: cheapest ? cheapest.rate : (updatedShipment.rate ?? 0),
            }
          : s
      );

      updateResults({
        ...(latest as BulkUploadResult),
        processedShipments: updatedShipments
      });

      toast.success('Rates refreshed after edit');
    } catch (err) {
      console.error('Error refreshing rates after edit:', err);
      toast.error('Failed to refresh rates after edit');
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  const handleBulkApplyCarrier = (carrierName: string, serviceName?: string) => {
    const latest = latestResultsRef.current;
    if (!latest) return;
    
    const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetCarrier = normalize(carrierName);
    const targetService = serviceName ? normalize(serviceName) : '';
    
    let matchCount = 0;
    
    const updatedShipments = latest.processedShipments.map(shipment => {
      if (!shipment.availableRates || shipment.availableRates.length === 0) return shipment;
      
      // Find matching rate: carrier must match, service is optional
      const matchingRate = shipment.availableRates.find((rate: any) => {
        const rc = normalize(String(rate.carrier));
        const rs = normalize(String(rate.service));
        
        const carrierMatch = rc === targetCarrier || rc.includes(targetCarrier) || targetCarrier.includes(rc);
        if (!carrierMatch) return false;
        
        // If no service specified, match any rate from this carrier
        if (!targetService) return true;
        
        // Flexible service matching
        return rs === targetService || rs.includes(targetService) || targetService.includes(rs);
      });
      
      if (matchingRate) {
        matchCount++;
        return { 
          ...shipment, 
          selectedRateId: matchingRate.id,
          carrier: matchingRate.carrier,
          service: matchingRate.service,
          rate: Number(matchingRate.rate)
        } as any;
      }
      
      return shipment as any;
    });
    
    // Recalculate totals including insurance
    const updatedWithInsurance = updatedShipments.map((s: any) => {
      const declared = (s.declared_value ?? s.details?.declared_value ?? 0) as number;
      const insuranceCost = s.insurance_enabled === false ? 0 : (declared > 0 ? Math.ceil(Number(declared) / 100) * 2 : 0);
      return { ...s, insurance_cost: insuranceCost } as any;
    });

    const totalCost = updatedWithInsurance.reduce((sum: number, shipment: any) => {
      const selectedRate = shipment.availableRates?.find((rate: any) => rate.id === shipment.selectedRateId);
      const rate = Number(selectedRate?.rate ?? shipment.rate ?? 0);
      return sum + rate + (shipment.insurance_cost || 0);
    }, 0);
    
    updateResults({
      ...(latest as BulkUploadResult),
      processedShipments: updatedWithInsurance,
      totalCost
    });
    
    if (matchCount > 0) {
      toast.success(`Applied ${carrierName}${serviceName ? ' ' + serviceName : ''} to ${matchCount} shipments`);
    } else {
      toast.warning(`No shipments have ${carrierName}${serviceName ? ' ' + serviceName : ''} available in their rates`);
    }
  };

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleRefreshRatesAfterEdit,
    handleBulkApplyCarrier
  };
};
