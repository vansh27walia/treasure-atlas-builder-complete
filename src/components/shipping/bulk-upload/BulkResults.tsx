
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertCircle, Package } from 'lucide-react';
import EditableShipmentRow from './EditableShipmentRow';
import { BulkUploadResult } from '@/types/shipping';

interface BulkResultsProps {
  results: BulkUploadResult;
  onRateChange: (shipmentId: string, rateId: string) => void;
  onRemoveShipment?: (shipmentId: string) => void;
  onEditShipment?: (shipmentId: string, updates: any) => void;
}

const BulkResults: React.FC<BulkResultsProps> = ({
  results,
  onRateChange,
  onRemoveShipment = () => {},
  onEditShipment = () => {}
}) => {
  if (!results || !results.processedShipments) {
    return null;
  }

  const shipments = Array.isArray(results.processedShipments) 
    ? results.processedShipments 
    : Object.values(results.processedShipments).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-800">
              {results.successful || 0}
            </div>
            <div className="text-sm text-green-600">Successful</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-800">
              {results.failed || 0}
            </div>
            <div className="text-sm text-red-600">Failed</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-800">
              {results.total || 0}
            </div>
            <div className="text-sm text-blue-600">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      {shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Shipment Details
              <Badge variant="secondary">{shipments.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Package Info</TableHead>
                    <TableHead>Selected Rate</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <EditableShipmentRow
                      key={shipment.id}
                      shipment={shipment}
                      onSelectRate={onRateChange}
                      onRemoveShipment={onRemoveShipment}
                      onEditShipment={onEditShipment}
                      pickupAddress={results.pickupAddress}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkResults;
