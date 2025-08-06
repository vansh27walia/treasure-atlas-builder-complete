
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, RefreshCw, AlertTriangle, Edit, Save, X } from 'lucide-react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsClearanceButton from './CustomsClearanceButton';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface BulkShipmentsListProps {
  results: BulkUploadResult | null;
  updateResults: (newResults: BulkUploadResult) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  results,
  updateResults
}) => {
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isRefreshingIndividual, setIsRefreshingIndividual] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
  } = useShipmentRates(results, updateResults);

  // Handle individual shipment rate refresh with better error handling
  const refreshIndividualRates = async (shipmentId: string) => {
    if (!results) return;
    
    setIsRefreshingIndividual(shipmentId);
    setApiErrors(prev => ({ ...prev, [shipmentId]: '' }));
    
    try {
      const shipment = results.processedShipments.find(s => s.id === shipmentId);
      if (!shipment) throw new Error('Shipment not found');

      // Ensure phone number is provided
      const fromAddress = {
        ...results.pickupAddress,
        phone: results.pickupAddress.phone || '+1-800-555-0199' // Fallback phone
      };

      const toAddress = {
        name: shipment.details?.name || shipment.recipient,
        company: shipment.details?.company || '',
        street1: shipment.details?.street1 || '',
        street2: shipment.details?.street2 || '',
        city: shipment.details?.city || '',
        state: shipment.details?.state || '',
        zip: shipment.details?.zip || '',
        country: shipment.details?.country || 'US',
        phone: shipment.details?.phone || '+1-800-555-0199', // Fallback phone
      };

      console.log('Refreshing rates for shipment:', shipmentId);
      console.log('From address:', fromAddress);
      console.log('To address:', toAddress);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel: {
            length: shipment.details?.parcel_length || 12,
            width: shipment.details?.parcel_width || 8,
            height: shipment.details?.parcel_height || 4,
            weight: shipment.details?.parcel_weight || 16,
          },
          // Include customs info if it exists for this shipment
          customsInfo: shipment.customsInfo || null
        }
      });

      if (error) {
        console.error('EasyPost API error:', error);
        let errorMessage = 'Failed to refresh rates';
        
        // Parse EasyPost specific errors
        if (error.message) {
          try {
            const parsed = JSON.parse(error.message);
            if (parsed.error && parsed.error.message) {
              errorMessage = `EasyPost Error: ${parsed.error.message}`;
              if (parsed.error.errors && parsed.error.errors.length > 0) {
                errorMessage += ` - ${parsed.error.errors[0].message}`;
              }
            }
          } catch (e) {
            errorMessage = error.message;
          }
        }
        
        setApiErrors(prev => ({ ...prev, [shipmentId]: errorMessage }));
        toast.error(errorMessage);
        return;
      }

      if (data && data.rates && data.rates.length > 0) {
        // Update the specific shipment with new rates
        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s,
              availableRates: data.rates,
              selectedRateId: data.rates[0]?.id,
              carrier: data.rates[0]?.carrier || s.carrier,
              service: data.rates[0]?.service || s.service,
              rate: parseFloat(data.rates[0]?.rate || '0') || s.rate,
              error: undefined, // Clear any previous errors
            };
          }
          return s;
        });

        // Calculate new total cost
        const newTotalCost = updatedShipments.reduce((total, s) => {
          const selectedRate = s.availableRates?.find(rate => rate.id === s.selectedRateId);
          return total + (parseFloat(selectedRate?.rate || '0') || 0);
        }, 0);

        updateResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: newTotalCost,
        });

        toast.success('Rates refreshed successfully');
        setApiErrors(prev => ({ ...prev, [shipmentId]: '' }));
      } else {
        throw new Error('No rates returned from API');
      }

    } catch (error) {
      console.error('Error refreshing individual rates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiErrors(prev => ({ ...prev, [shipmentId]: errorMessage }));
      toast.error(`Failed to refresh rates: ${errorMessage}`);
    } finally {
      setIsRefreshingIndividual(null);
    }
  };

  const handleEditShipment = (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => 
      shipment.id === shipmentId ? { ...shipment, ...updates } : shipment
    );
    
    updateResults({
      ...results,
      processedShipments: updatedShipments
    });

    // After editing, automatically refresh rates for this shipment
    setTimeout(() => refreshIndividualRates(shipmentId), 500);
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(s => s.id !== shipmentId);
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return total + (parseFloat(selectedRate?.rate || '0') || 0);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success('Shipment removed');
  };

  const handleCustomsInfoUpdate = (shipmentId: string, customsInfo: any) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => 
      shipment.id === shipmentId ? { ...shipment, customsInfo } : shipment
    );
    
    updateResults({
      ...results,
      processedShipments: updatedShipments
    });

    console.log(`Updated customs info for shipment ${shipmentId}:`, customsInfo);
  };

  if (!results) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No shipments to display</p>
        </CardContent>
      </Card>
    );
  }

  const { processedShipments, totalCost } = results;

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Bulk Shipments ({processedShipments.length})</span>
            <Button
              onClick={() => fetchAllShipmentRates(processedShipments)}
              disabled={isFetchingRates}
              variant="outline"
              size="sm"
            >
              {isFetchingRates ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh All Rates
            </Button>
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total estimated cost: <strong className="text-foreground">${totalCost.toFixed(2)}</strong></span>
            {Object.keys(apiErrors).filter(id => apiErrors[id]).length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {Object.keys(apiErrors).filter(id => apiErrors[id]).length} errors
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Shipments table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient & Address</TableHead>
                <TableHead>Package Details</TableHead>
                <TableHead>Selected Rate</TableHead>
                <TableHead>Customs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedShipments.map((shipment) => (
                <React.Fragment key={shipment.id}>
                  <EditableShipmentRow
                    shipment={shipment}
                    onSelectRate={handleSelectRate}
                    onRemoveShipment={handleRemoveShipment}
                    onEditShipment={handleEditShipment}
                    isRefreshing={isRefreshingIndividual === shipment.id}
                    onRefreshRates={() => refreshIndividualRates(shipment.id)}
                  />
                  {/* Show API errors for this specific shipment */}
                  {apiErrors[shipment.id] && (
                    <TableRow>
                      <td colSpan={5} className="p-0">
                        <Alert variant="destructive" className="m-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error for {shipment.recipient}:</strong> {apiErrors[shipment.id]}
                          </AlertDescription>
                        </Alert>
                      </td>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customs clearance for international shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customs Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure customs information for international shipments. Each shipment can have individual customs data.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {processedShipments
            .filter(shipment => shipment.details?.country !== 'US')
            .map(shipment => (
              <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{shipment.recipient}</p>
                  <p className="text-sm text-muted-foreground">
                    {shipment.details?.city}, {shipment.details?.country}
                  </p>
                </div>
                <CustomsClearanceButton
                  shipmentId={shipment.id}
                  onCustomsInfoUpdate={(customsInfo) => handleCustomsInfoUpdate(shipment.id, customsInfo)}
                  existingCustomsInfo={shipment.customsInfo}
                />
              </div>
            ))}
          {processedShipments.filter(shipment => shipment.details?.country !== 'US').length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No international shipments requiring customs information.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkShipmentsList;
