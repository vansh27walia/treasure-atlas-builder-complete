
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, AlertCircle, CheckCircle, Package, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import EnhancedPrintPreview from '@/components/shipping/EnhancedPrintPreview';

interface Shipment {
  id: string;
  status: 'completed' | 'failed' | 'pending';
  tracking_code?: string;
  label_url?: string;
  label_urls?: {
    pdf?: string;
    png?: string;
    zpl?: string;
  };
  service?: string;
  carrier?: string;
  cost?: number;
  to_address?: {
    name?: string;
    street1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  from_address?: {
    name?: string;
    street1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  weight?: string;
  dimensions?: string;
  error_message?: string;
}

interface LabelResultsTableProps {
  shipments: Shipment[];
  onDownloadLabel: (url: string, format?: string) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel
}) => {
  const [previewShipment, setPreviewShipment] = useState<Shipment | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handlePrintPreview = (shipment: Shipment) => {
    const labelUrl = shipment.label_urls?.pdf || shipment.label_url;
    if (labelUrl && labelUrl.trim() !== '') {
      setPreviewShipment(shipment);
      setShowPrintPreview(true);
    } else {
      toast.error('No PDF label available for preview');
    }
  };

  const handleDownloadAll = () => {
    const successfulShipments = shipments.filter(shipment => 
      shipment.status === 'completed' && 
      (shipment.label_url || shipment.label_urls?.pdf)
    );

    if (successfulShipments.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    let downloadCount = 0;
    successfulShipments.forEach((shipment, index) => {
      setTimeout(() => {
        const labelUrl = shipment.label_urls?.pdf || shipment.label_url;
        if (labelUrl) {
          onDownloadLabel(labelUrl, 'pdf');
          downloadCount++;
          if (downloadCount === successfulShipments.length) {
            toast.success(`Downloaded ${downloadCount} labels`);
          }
        }
      }, index * 500); // Stagger downloads to avoid browser blocking
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasSuccessfulLabels = shipments.some(shipment => 
    shipment.status === 'completed' && 
    (shipment.label_url || shipment.label_urls?.pdf)
  );

  return (
    <div className="space-y-4">
      {/* Download All Button */}
      {hasSuccessfulLabels && (
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadAll}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download All Labels
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Tracking</TableHead>
              <TableHead className="font-semibold">Service</TableHead>
              <TableHead className="font-semibold">Destination</TableHead>
              <TableHead className="font-semibold">Cost</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment, index) => (
              <TableRow key={shipment.id || index} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center">
                    {shipment.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : shipment.status === 'failed' ? (
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    ) : (
                      <Package className="h-4 w-4 text-yellow-500 mr-2" />
                    )}
                    {getStatusBadge(shipment.status)}
                  </div>
                </TableCell>
                
                <TableCell>
                  {shipment.tracking_code ? (
                    <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {shipment.tracking_code}
                    </div>
                  ) : (
                    <span className="text-gray-400">No tracking</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{shipment.carrier || 'Unknown'}</div>
                    <div className="text-gray-500">{shipment.service || 'Standard'}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {shipment.to_address ? (
                      <>
                        <div className="font-medium">{shipment.to_address.name || 'No name'}</div>
                        <div className="text-gray-500">
                          {shipment.to_address.city}, {shipment.to_address.state} {shipment.to_address.zip}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Address unavailable</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {shipment.cost ? (
                    <span className="font-medium">${shipment.cost.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {shipment.status === 'completed' && (shipment.label_url || shipment.label_urls?.pdf) ? (
                      <>
                        {/* Print Preview Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintPreview(shipment)}
                          className="border-purple-200 hover:bg-purple-50 text-purple-700"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        
                        {/* Download Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const labelUrl = shipment.label_urls?.pdf || shipment.label_url;
                            if (labelUrl && labelUrl.trim() !== '') {
                              onDownloadLabel(labelUrl, 'pdf');
                            } else {
                              toast.error('Invalid label URL');
                            }
                          }}
                          className="border-blue-200 hover:bg-blue-50 text-blue-700"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </>
                    ) : shipment.status === 'failed' ? (
                      <div className="text-xs text-red-600 max-w-32 truncate" title={shipment.error_message}>
                        {shipment.error_message || 'Failed to create label'}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No actions</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Print Preview Modal */}
      {previewShipment && showPrintPreview && (
        <EnhancedPrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={previewShipment.label_urls?.pdf || previewShipment.label_url || ''}
          trackingCode={previewShipment.tracking_code || null}
          shipmentId={previewShipment.id}
          shipmentDetails={{
            fromAddress: previewShipment.from_address ? 
              `${previewShipment.from_address.name || ''}, ${previewShipment.from_address.street1 || ''}, ${previewShipment.from_address.city || ''}, ${previewShipment.from_address.state || ''} ${previewShipment.from_address.zip || ''}` : 
              'Address not available',
            toAddress: previewShipment.to_address ? 
              `${previewShipment.to_address.name || ''}, ${previewShipment.to_address.street1 || ''}, ${previewShipment.to_address.city || ''}, ${previewShipment.to_address.state || ''} ${previewShipment.to_address.zip || ''}` : 
              'Address not available',
            weight: previewShipment.weight || 'Unknown',
            dimensions: previewShipment.dimensions || 'Unknown',
            service: previewShipment.service || 'Standard',
            carrier: previewShipment.carrier || 'Unknown'
          }}
        />
      )}
    </div>
  );
};

export default LabelResultsTable;
