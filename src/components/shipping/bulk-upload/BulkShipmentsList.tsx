import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Package, RefreshCw, Trash2 } from 'lucide-react';
import { BulkShipment, BulkShipmentStatus, ShipmentDetails, Rate } from '@/types/shipping';
import { BulkShipmentFilterField } from './BulkShipmentFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from "@/components/ui/skeleton"

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  isCreatingLabels: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: Partial<ShipmentDetails>) => void;
  onRefreshRates: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  isCreatingLabels,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<BulkShipmentFilterField>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [editingShipment, setEditingShipment] = useState<string | null>(null);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm ||
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCarrier = !selectedCarrierFilter ||
      shipment.carrier === selectedCarrierFilter;

    return matchesSearch && matchesCarrier;
  }).sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'recipient':
        aValue = a.recipient;
        bValue = b.recipient;
        break;
      case 'carrier':
        aValue = a.carrier;
        bValue = b.carrier;
        break;
      case 'rate':
        aValue = a.rate;
        bValue = b.rate;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusBadge = (status: BulkShipmentStatus) => {
    const statusConfig: Record<BulkShipmentStatus, string> = {
      pending_upload: 'bg-gray-100 text-gray-800',
      parsed: 'bg-blue-100 text-blue-800',
      pending_rates: 'bg-yellow-100 text-yellow-800',
      rates_fetched: 'bg-green-100 text-green-800',
      rate_selected: 'bg-purple-100 text-purple-800',
      label_purchased: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={`${statusConfig[status]} border-0`}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Search shipments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center space-x-2">
          <Select value={sortField} onValueChange={(value) => setSortField(value as BulkShipmentFilterField)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recipient">Recipient</SelectItem>
              <SelectItem value="carrier">Carrier</SelectItem>
              <SelectItem value="rate">Rate</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>

          <Select value={selectedCarrierFilter} onValueChange={setSelectedCarrierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Carriers</SelectItem>
              <SelectItem value="USPS">USPS</SelectItem>
              <SelectItem value="UPS">UPS</SelectItem>
              <SelectItem value="FedEx">FedEx</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableCaption>A list of your bulk shipments.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetchingRates ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell className="text-right"><Skeleton /></TableCell>
                </TableRow>
              ))}
            </>
          ) : (
            filteredShipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell>{shipment.recipient}</TableCell>
                <TableCell>{shipment.carrier || 'N/A'}</TableCell>
                <TableCell>{shipment.service || 'N/A'}</TableCell>
                <TableCell>{shipment.rate ? `$${shipment.rate.toFixed(2)}` : 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {shipment.status === 'parsed' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onRefreshRates(shipment.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    {shipment.availableRates && shipment.availableRates.length > 0 && shipment.status !== 'completed' && (
                      <Select onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipment.availableRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {`${rate.carrier} - ${rate.service} ($${rate.rate})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEditShipment(shipment.id, {})}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => onRemoveShipment(shipment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BulkShipmentsList;
