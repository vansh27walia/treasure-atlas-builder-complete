
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, File, FileImage, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';

interface LabelResultsTableProps {
  shipments: any[];
  onDownloadLabel: (shipment: any, format: string) => void;
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
    };
    scanFormUrl?: string | null;
  } | null;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel,
  batchResult
}) => {
  const handleDownload = (shipment: any, format: string = 'png') => {
    console.log('Attempting download for:', { format, shipmentId: shipment.id, labelUrls: shipment.label_urls });
    onDownloadLabel(shipment, format);
  };

  const handleBatchPdfDownload = () => {
    if (batchResult?.consolidatedLabelUrls?.pdf) {
      const link = document.createElement('a');
      link.href = batchResult.consolidatedLabelUrls.pdf;
      link.download = `batch_labels_${batchResult.batchId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Batch PDF download started');
    } else {
      toast.error('Batch PDF not available');
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generated Shipping Labels</h3>
            <p className="text-sm text-gray-600 mt-1">
              {shipments.length} label{shipments.length !== 1 ? 's' : ''} ready for download in multiple formats
            </p>
          </div>
          
          {/* Batch PDF Download Button */}
          {batchResult?.consolidatedLabelUrls?.pdf && (
            <div className="flex gap-2">
              <Button
                onClick={handleBatchPdfDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All Labels as PDF
              </Button>
              
              <PrintPreview
                labelUrl={batchResult.consolidatedLabelUrls.pdf}
                trackingCode={`Batch ${batchResult.batchId}`}
                labelUrls={batchResult.consolidatedLabelUrls}
                shipmentDetails={{
                  fromAddress: 'Batch Labels',
                  toAddress: `${shipments.length} shipments`,
                  weight: 'Combined',
                  dimensions: 'Batch',
                  service: 'Batch Processing',
                  carrier: 'Multiple'
                }}
                shipmentId={batchResult.batchId}
                isBatchPreview={true}
                triggerButton={
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Batch PDF
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrier & Drop-off Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions & Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label Formats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment, index) => (
              <tr key={shipment.id || shipment.original_shipment_id || index} className="hover:bg-gray-50">
                {/* Tracking */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.tracking_code || shipment.tracking_number || 'Pending'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {shipment.status === 'success' || shipment.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Carrier & Drop-off Details */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.carrier || 'Unknown Carrier'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {shipment.customer_name || shipment.recipient || 'No recipient name'}
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs">
                      {shipment.customer_address || 'No address available'}
                    </div>
                  </div>
                </td>

                {/* Dimensions & Weight */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">
                      {shipment.details?.length && shipment.details?.width && shipment.details?.height ? (
                        <span>{shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"</span>
                      ) : (
                        <span className="text-gray-400">No dimensions</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {shipment.details?.weight ? (
                        <span>{shipment.details.weight} lbs</span>
                      ) : (
                        <span className="text-gray-400">No weight</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Label Formats */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {/* PNG Format */}
                    {(shipment.label_urls?.png || shipment.label_url) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'png')}
                        className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <FileImage className="h-3 w-3 mr-1" />
                        PNG
                      </Button>
                    )}
                    
                    {/* PDF Format */}
                    {shipment.label_urls?.pdf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'pdf')}
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <File className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    )}
                    
                    {/* ZPL Format */}
                    {shipment.label_urls?.zpl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'zpl')}
                        className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        ZPL
                      </Button>
                    )}
                    
                    {!(shipment.label_urls?.png || shipment.label_url || shipment.label_urls?.pdf || shipment.label_urls?.zpl) && (
                      <span className="text-xs text-gray-400 italic">No formats available</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(shipment, 'png')} // Default download is PNG
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={!(shipment.label_urls?.png || shipment.label_url)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    
                    {/* PrintPreview for individual label - now uses PDF */}
                    <PrintPreview
                      labelUrl={shipment.label_urls?.pdf || shipment.label_urls?.png || shipment.label_url || ''}
                      trackingCode={shipment.tracking_code || shipment.tracking_number}
                      labelUrls={shipment.label_urls}
                      shipmentDetails={{
                        fromAddress: 'Your Saved Pickup Address',
                        toAddress: shipment.customer_address || '',
                        weight: shipment.details?.weight ? `${shipment.details.weight} lbs` : 'N/A',
                        dimensions: shipment.details?.length && shipment.details?.width && shipment.details?.height ? 
                          `${shipment.details.length}"×${shipment.details.width}"×${shipment.details.height}"` : 'N/A',
                        service: shipment.service || 'N/A',
                        carrier: shipment.carrier || 'N/A'
                      }}
                      shipmentId={shipment.id || shipment.original_shipment_id}
                    />
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
