
import React from 'react';
import { BulkShipment, Rate } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit3, RefreshCw, AlertCircle, CheckCircle, Loader2, Eye, Package } from 'lucide-react'; // Added Package
import { Badge } from '@/components/ui/badge';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean; 
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: BulkShipment) => void; 
  onRefreshRates: (shipmentId: string) => void;
  onPreviewLabel?: (shipment: BulkShipment) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates: isGlobalFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onPreviewLabel
}) => {
  if (!shipments || shipments.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          No shipments to display. Upload a file or check your filters.
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (shipment: BulkShipment) => {
    if (shipment.isFetchingRates) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Fetching Rates</Badge>;
    }
    switch (shipment.status) {
      case 'pending_rates':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Awaiting Rates</Badge>;
      case 'rates_fetched':
        return <Badge variant="outline" className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />Rates Ready</Badge>;
      case 'rate_selected':
        return <Badge className="bg-indigo-600 hover:bg-indigo-700"><CheckCircle className="mr-1 h-3 w-3" />Rate Selected</Badge>;
      case 'label_purchased':
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Label Purchased</Badge>;
      case 'completed':
         return <Badge className="bg-green-500 text-white"><CheckCircle className="mr-1 h-3 w-3" />Label Generated</Badge>;
      case 'error':
      case 'failed':
        return <Badge variant="destructive" title={typeof shipment.details === 'string' ? shipment.details : JSON.stringify(shipment.details)}><AlertCircle className="mr-1 h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };
  
  const getRowColor = (shipment: BulkShipment) => {
    if (shipment.status === 'error' || shipment.status === 'failed') return 'bg-red-50 hover:bg-red-100';
    if (shipment.status === 'completed' || shipment.status === 'label_purchased' || (shipment.status === 'rate_selected' && shipment.selectedRateId)) return 'bg-green-50 hover:bg-green-100';
    return 'hover:bg-gray-50';
  };

  return (
    <Card className="mt-6 overflow-hidden shadow-lg">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Shipment Details & Rate Selection ({shipments.length} shipments)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[50px] text-xs font-medium text-gray-600">Row</TableHead>
                <TableHead className="min-w-[180px] text-xs font-medium text-gray-600">Recipient</TableHead>
                <TableHead className="min-w-[150px] text-xs font-medium text-gray-600">Status</TableHead>
                <TableHead className="min-w-[250px] text-xs font-medium text-gray-600">Carrier & Service</TableHead>
                <TableHead className="text-right min-w-[100px] text-xs font-medium text-gray-600">Rate</TableHead>
                <TableHead className="text-center min-w-[200px] text-xs font-medium text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id || shipment.row} className={`transition-colors duration-150 ease-in-out ${getRowColor(shipment)}`}>
                  <TableCell className="font-mono text-xs text-gray-500">{shipment.row || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-gray-900">{shipment.customer_name || shipment.recipient}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{shipment.customer_address || `${shipment.street1}, ${shipment.city}`}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(shipment)}</TableCell>
                  <TableCell>
                    {shipment.isFetchingRates ? (
                      <div className="flex items-center text-sm text-blue-600">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading rates...
                      </div>
                    ) : shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <Select
                        value={shipment.selectedRateId || undefined}
                        onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
                        disabled={shipment.status === 'completed' || shipment.status === 'label_purchased'}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select a rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipment.availableRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id} className="text-xs">
                              {rate.carrier} {rate.service} (${rate.rate})
                              {rate.delivery_days && ` (${rate.delivery_days} days)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : shipment.status === 'pending_rates' || isGlobalFetchingRates ? (
                       <div className="flex items-center text-sm text-gray-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fetching rates...
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No rates available</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {shipment.selectedRateId && shipment.rate != null ? (
                      <span className="font-semibold text-sm text-gray-800">${Number(shipment.rate).toFixed(2)}</span>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRefreshRates(shipment.id)}
                        disabled={shipment.isFetchingRates || shipment.status === 'completed' || shipment.status === 'label_purchased'}
                        title="Refresh Rates"
                        className="h-7 w-7 text-blue-600 hover:text-blue-800"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditShipment(shipment.id, shipment)}
                        disabled={shipment.status === 'completed' || shipment.status === 'label_purchased'}
                        title="Edit Shipment"
                        className="h-7 w-7 text-yellow-600 hover:text-yellow-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveShipment(shipment.id)}
                        title="Remove Shipment"
                        className="h-7 w-7 text-red-600 hover:text-red-800"
                        disabled={shipment.status === 'completed' || shipment.status === 'label_purchased'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {onPreviewLabel && (shipment.label_urls?.pdf || shipment.label_urls?.png || shipment.label_url) && (shipment.status === 'completed' || shipment.status === 'label_purchased') && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onPreviewLabel(shipment)} 
                            title="Preview Label"
                            className="h-7 w-7 text-purple-600 hover:text-purple-800"
                          >
                           <Eye className="h-3.5 w-3.5" />
                         </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkShipmentsList;
