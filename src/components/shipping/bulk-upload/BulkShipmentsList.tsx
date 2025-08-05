
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, Trash2, Edit, Globe } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  pickupCountry: string;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  pickupCountry = 'US'
}) => {
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<BulkShipment | null>(null);
  const [bulkCustomsMode, setBulkCustomsMode] = useState(false);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [customsData, setCustomsData] = useState<{ [shipmentId: string]: any }>({});

  // Check if shipment is international
  const isInternational = (shipment: BulkShipment): boolean => {
    const shipmentCountry = shipment.details?.to_address?.country || shipment.details?.country || 'US';
    return shipmentCountry.toUpperCase() !== pickupCountry.toUpperCase();
  };

  // Get international shipments
  const internationalShipments = shipments.filter(isInternational);
  const hasInternationalShipments = internationalShipments.length > 0;

  const handleCustomsClearance = (shipment: BulkShipment) => {
    setSelectedShipmentForCustoms(shipment);
    setBulkCustomsMode(false);
    setShowCustomsModal(true);
  };

  const handleBulkCustomsClearance = () => {
    if (internationalShipments.length === 0) return;
    
    setBulkCustomsMode(true);
    setSelectedShipmentForCustoms(internationalShipments[0]); // Use first international shipment as template
    setSelectedShipmentIds(internationalShipments.map(s => s.id));
    setShowCustomsModal(true);
  };

  const handleCustomsSubmit = (customs: any) => {
    if (bulkCustomsMode && selectedShipmentIds.length > 0) {
      // Apply customs to all selected international shipments
      const updatedCustomsData = { ...customsData };
      selectedShipmentIds.forEach(shipmentId => {
        updatedCustomsData[shipmentId] = customs;
        
        // Update the shipment with customs info
        const shipment = shipments.find(s => s.id === shipmentId);
        if (shipment) {
          onEditShipment(shipmentId, {
            ...shipment.details,
            customs_info: customs
          });
        }
      });
      setCustomsData(updatedCustomsData);
    } else if (selectedShipmentForCustoms) {
      // Apply customs to single shipment
      const updatedCustomsData = { ...customsData };
      updatedCustomsData[selectedShipmentForCustoms.id] = customs;
      setCustomsData(updatedCustomsData);
      
      // Update the shipment with customs info
      onEditShipment(selectedShipmentForCustoms.id, {
        ...selectedShipmentForCustoms.details,
        customs_info: customs
      });
    }

    setShowCustomsModal(false);
    setSelectedShipmentForCustoms(null);
    setBulkCustomsMode(false);
    setSelectedShipmentIds([]);
  };

  const handleShipmentSelection = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipmentIds(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipmentIds(prev => prev.filter(id => id !== shipmentId));
    }
  };

  const handleSelectAllInternational = (checked: boolean) => {
    if (checked) {
      setSelectedShipmentIds(internationalShipments.map(s => s.id));
    } else {
      setSelectedShipmentIds([]);
    }
  };

  if (shipments.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No shipments to display. Upload a CSV file to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {hasInternationalShipments && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">International Shipments Detected</h3>
                <p className="text-sm text-blue-700">
                  {internationalShipments.length} shipments require customs documentation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-international"
                checked={selectedShipmentIds.length === internationalShipments.length}
                onCheckedChange={handleSelectAllInternational}
              />
              <label htmlFor="select-all-international" className="text-sm text-blue-700">
                Select all international
              </label>
              <Button
                onClick={handleBulkCustomsClearance}
                variant="outline"
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Bulk Customs Clearance
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Details</TableHead>
              <TableHead>Package Info</TableHead>
              <TableHead>Selected Rate</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Customs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const isIntl = isInternational(shipment);
              const hasCustoms = customsData[shipment.id];
              
              return (
                <TableRow key={shipment.id} className={isIntl ? 'bg-blue-50/30' : ''}>
                  <EditableShipmentRow
                    shipment={shipment}
                    onSelectRate={onSelectRate}
                    onRemoveShipment={onRemoveShipment}
                    onEditShipment={onEditShipment}
                  />
                  
                  {/* Customs Column */}
                  <td className="px-6 py-4">
                    {isIntl ? (
                      <div className="flex items-center gap-2">
                        {bulkCustomsMode && (
                          <Checkbox
                            checked={selectedShipmentIds.includes(shipment.id)}
                            onCheckedChange={(checked) => 
                              handleShipmentSelection(shipment.id, checked as boolean)
                            }
                          />
                        )}
                        <Button
                          onClick={() => handleCustomsClearance(shipment)}
                          size="sm"
                          variant={hasCustoms ? "default" : "outline"}
                          className={hasCustoms ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Globe className="w-4 h-4 mr-1" />
                          {hasCustoms ? 'Completed' : 'Customs'}
                        </Button>
                        {hasCustoms && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Ready
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Domestic</Badge>
                    )}
                  </td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => {
          setShowCustomsModal(false);
          setSelectedShipmentForCustoms(null);
          setBulkCustomsMode(false);
        }}
        onSubmit={handleCustomsSubmit}
        fromCountry={pickupCountry}
        toCountry={selectedShipmentForCustoms?.details?.to_address?.country || 'US'}
        initialData={selectedShipmentForCustoms ? customsData[selectedShipmentForCustoms.id] : undefined}
      />
    </div>
  );
};

export default BulkShipmentsList;
