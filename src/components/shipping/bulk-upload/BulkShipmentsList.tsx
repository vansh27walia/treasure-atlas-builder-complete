
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Download, Eye, Trash2, RotateCcw } from 'lucide-react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsClearanceButton from './CustomsClearanceButton';

interface CustomsInfo {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  contents_explanation?: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments?: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number?: string;
    origin_country: string;
  }>;
}

interface BulkShipmentsListProps {
  results: BulkUploadResult;
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => Promise<void>;
  onAIAnalysis: (shipment?: any) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  results,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis
}) => {
  const [customsData, setCustomsData] = useState<Record<string, CustomsInfo>>({});

  const handleCustomsInfoUpdate = (shipmentId: string, customsInfo: CustomsInfo) => {
    setCustomsData(prev => ({
      ...prev,
      [shipmentId]: customsInfo
    }));

    // Update the shipment with customs info
    onEditShipment(shipmentId, {
      customs_info: customsInfo
    });
  };

  if (!results.processedShipments || results.processedShipments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No shipments to display</p>
        </CardContent>
      </Card>
    );
  }

  const completedShipments = results.processedShipments.filter(s => s.status === 'completed' || s.status === 'label_purchased');
  const progressPercentage = (completedShipments.length / results.processedShipments.length) * 100;

  // Helper function to safely get address string
  const getAddressString = (shipment: BulkShipment): string => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      const addr = shipment.customer_address as any;
      return addr.street1 || '';
    }
    
    if (shipment.details?.to_address) {
      return shipment.details.to_address.street1 || '';
    }
    
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bulk Shipping Progress
            <Badge variant="secondary">{results.processedShipments.length} Shipments</Badge>
          </CardTitle>
          <CardDescription>
            {results.successful} successful, {results.failed} failed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
          {results.totalCost && (
            <div className="mt-4 text-lg font-semibold">
              Total Cost: ${results.totalCost.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Details</CardTitle>
          <CardDescription>
            Review and manage your bulk shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Dimensions & Weight</TableHead>
                  <TableHead>Selected Rate</TableHead>
                  <TableHead>Customs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.processedShipments.map((shipment) => {
                  // Check if shipment is international
                  const isInternational = () => {
                    const toCountry = shipment.details?.to_address?.country || shipment.details?.to_country;
                    const country = toCountry?.toUpperCase();
                    return country !== 'US' && country !== 'USA' && country !== 'UNITED STATES';
                  };

                  return (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                          <div className="text-sm text-gray-500">
                            {getAddressString(shipment)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {shipment.details?.parcel?.weight || shipment.details?.weight || 1} oz
                          </div>
                          <div className="text-sm text-gray-500">
                            {shipment.details?.parcel?.length || shipment.details?.length || 1}" × {shipment.details?.parcel?.width || shipment.details?.width || 1}" × {shipment.details?.parcel?.height || shipment.details?.height || 1}"
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {shipment.availableRates && shipment.availableRates.length > 0 ? (
                          <div className="space-y-2">
                            {shipment.selectedRateId ? (
                              (() => {
                                const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                                return selectedRate ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      ${parseFloat(selectedRate.rate.toString()).toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {selectedRate.carrier} {selectedRate.service}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {selectedRate.delivery_days ? `${selectedRate.delivery_days} days` : 'Standard delivery'}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline">No rate selected</Badge>
                                );
                              })()
                            ) : (
                              <Badge variant="outline">No rate selected</Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">
                            {isFetchingRates ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Loading rates...
                              </>
                            ) : (
                              'No rates available'
                            )}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {isInternational() ? (
                          <CustomsClearanceButton
                            shipment={shipment}
                            customsInfo={customsData[shipment.id]}
                            onCustomsInfoSave={(info) => handleCustomsInfoUpdate(shipment.id, info)}
                          />
                        ) : (
                          <Badge variant="secondary">Domestic</Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={
                            shipment.status === 'completed' || shipment.status === 'label_purchased' 
                              ? 'default'
                              : shipment.status === 'error' || shipment.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            shipment.status === 'completed' || shipment.status === 'label_purchased' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : ''
                          }
                        >
                          {shipment.status === 'pending_rates' ? 'Fetching Rates' :
                           shipment.status === 'rates_fetched' ? 'Ready' :
                           shipment.status === 'rate_selected' ? 'Rate Selected' :
                           shipment.status === 'label_purchased' ? 'Label Created' :
                           shipment.status === 'completed' ? 'Completed' :
                           shipment.status === 'error' ? 'Error' :
                           shipment.status === 'failed' ? 'Failed' :
                           'Unknown'}
                        </Badge>
                        {shipment.error && (
                          <div className="text-xs text-red-500 mt-1">
                            {shipment.error}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {(shipment.status === 'completed' || shipment.status === 'label_purchased') && shipment.label_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(shipment.label_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {shipment.availableRates && shipment.availableRates.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRefreshRates(shipment.id)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRemoveShipment(shipment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {results.processedShipments.some(s => s.selectedRateId && (s.status === 'rates_fetched' || s.status === 'rate_selected')) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Ready to Create Labels</h3>
                <p className="text-sm text-gray-500">
                  {results.processedShipments.filter(s => s.selectedRateId && (s.status === 'rates_fetched' || s.status === 'rate_selected')).length} shipments ready
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => onAIAnalysis()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Create All Labels
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkShipmentsList;
