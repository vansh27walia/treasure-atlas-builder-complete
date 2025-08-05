
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BulkShipmentsList from './BulkShipmentsList';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

interface BulkResultsProps {
  results: BulkUploadResult;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
}

const BulkResults: React.FC<BulkResultsProps> = ({
  results,
  onSelectRate,
  onRemoveShipment,
  onEditShipment
}) => {
  const pickupCountry = results.pickupAddress?.country || 'US';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Upload Summary
            <div className="flex gap-2">
              <Badge variant="outline">Total: {results.total}</Badge>
              <Badge variant="outline" className="text-green-600">Success: {results.successful}</Badge>
              {results.failed > 0 && (
                <Badge variant="outline" className="text-red-600">Failed: {results.failed}</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Review your shipments below. International shipments will show customs options.
          </p>
        </CardContent>
      </Card>

      <BulkShipmentsList
        shipments={results.processedShipments}
        onSelectRate={onSelectRate}
        onRemoveShipment={onRemoveShipment}
        onEditShipment={onEditShipment}
        pickupCountry={pickupCountry}
      />
    </div>
  );
};

export default BulkResults;
