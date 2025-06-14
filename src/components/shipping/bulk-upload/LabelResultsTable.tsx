import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, FileText, FileImage, Printer as PrinterIcon, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { BulkShipment, LabelFormat } from '@/types/shipping';

export interface LabelResultsTableProps {
  shipments: BulkShipment[];
  onDownloadLabel: (shipmentId: string, url: string, format: string) => Promise<void> | void;
  onPreviewLabel: (shipment: BulkShipment) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel,
  onPreviewLabel
}) => {
  const handleDownload = (shipment: BulkShipment, format: LabelFormat) => {
    console.log('Attempting download for:', { format, shipmentId: shipment.id, labelUrls: shipment.label_urls });
    
    let url: string | undefined;
    if (format === 'pdf') url = shipment.label_urls?.pdf;
    else if (format === 'png') url = shipment.label_urls?.png || shipment.label_url;
    else if (format === 'zpl') url = shipment.label_urls?.zpl;
    else if (format === 'epl') url = shipment.label_urls?.epl;

    if (!url) {
      toast.error(`${format.toUpperCase()} label not available for this shipment.`);
      console.error('URL not found for download:', { format, shipment });
      return;
    }
    onDownloadLabel(shipment.id, url, format);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Pending';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Pending';
    }
  };

  if (!shipments || shipments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Labels Generated</h3>
        <p className="text-gray-500">No shipping labels have been created yet.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Generated Shipping Labels</h3>
        <p className="text-sm text-gray-600 mt-1">
          {shipments.length} label{shipments.length !== 1 ? 's' : ''} ready for download/preview.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking & Recipient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available Formats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment, index) => (
              <tr key={shipment.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.tracking_code || shipment.tracking_number || 'Pending Tracking'}
                      </div>
                      <div className="text-xs text-gray-500">
                        To: {shipment.details.to_address.name || shipment.customer_name || 'N/A'}
                      </div>
                       <div className="text-xs text-gray-500 max-w-xs truncate" title={shipment.details.to_address.street1}>
                        {shipment.details.to_address.street1}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <div className="text-sm text-gray-700">
                      {shipment.carrier || 'N/A Carrier'} - {shipment.service || 'N/A Service'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shipment.details?.parcel?.length && shipment.details?.parcel?.width && shipment.details?.parcel?.height ? (
                        <span>Dims: {shipment.details.parcel.length}L x {shipment.details.parcel.width}W x {shipment.details.parcel.height}H in</span>
                      ) : (
                        <span className="text-gray-400">No dimensions</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shipment.details?.parcel?.weight ? (
                        <span>Weight: {shipment.details.parcel.weight} lbs</span>
                      ) : (
                        <span className="text-gray-400">No weight</span>
                      )}
                    </div>
                     <div className="text-xs text-gray-500">
                        {shipment.status === 'completed' ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                        ) : shipment.status === 'failed' || shipment.status === 'error' ? (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">{shipment.status}</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{shipment.status || 'Processing'}</Badge>
                        )}
                      </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    {(shipment.label_urls?.png || shipment.label_url) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'png')}
                        className="text-xs"
                      >
                        <FileImage className="h-3 w-3 mr-1" /> PNG
                      </Button>
                    )}
                    {shipment.label_urls?.pdf && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(shipment, 'pdf')} className="text-xs">
                        <FileText className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    )}
                    {shipment.label_urls?.zpl && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(shipment, 'zpl')} className="text-xs">
                        <PrinterIcon className="h-3 w-3 mr-1" /> ZPL
                      </Button>
                    )}
                    {!(shipment.label_urls?.png || shipment.label_url) && !shipment.label_urls?.pdf && !shipment.label_urls?.zpl && (
                      <span className="text-xs text-gray-400">No specific formats</span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                    <Button
                      size="sm"
                      onClick={() => onPreviewLabel(shipment)}
                      variant="outline"
                       className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                    {(shipment.label_urls?.png || shipment.label_url) && (
                         <Button
                            size="sm"
                            onClick={() => handleDownload(shipment, 'png')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" /> PNG
                        </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LabelResultsTable;
