
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, File, FileImage, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import EnhancedPrintPreview from '@/components/shipping/EnhancedPrintPreview';

interface LabelResultsTableProps {
  shipments: any[];
  onDownloadLabel: (url: string) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel
}) => {
  const handleDirectDownload = (shipment: any) => {
    const pdfUrl = shipment.label_urls?.pdf || shipment.label_url;
    if (!pdfUrl) {
      toast.error('PDF label not available for this shipment.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `shipping_label_${shipment.tracking_code || shipment.id || Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('PDF label downloaded successfully');
  };

  const handleDownload = (shipment: any, format: string = 'png') => {
    console.log('Attempting download for:', {
      format,
      shipmentId: shipment.id,
      labelUrls: shipment.label_urls
    });
    let url = shipment.label_urls?.[format];
    // Fallback for primary label_url if specific format not in label_urls (e.g. older data or only PNG was generated)
    if (!url && format === 'png') {
      url = shipment.label_url;
    }
    if (!url) {
      toast.error(`${format.toUpperCase()} label not available for this shipment.`);
      console.error('URL not found for download:', {
        format,
        shipment
      });
      return;
    }
    onDownloadLabel(url);
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
    return <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Labels Generated</h3>
        <p className="text-gray-500">No shipping labels have been created yet.</p>
      </Card>;
  }

  return <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Generated Shipping Labels</h3>
        <p className="text-sm text-gray-600 mt-1">
          {shipments.length} label{shipments.length !== 1 ? 's' : ''} ready for download in multiple formats
        </p>
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment, index) => {
            // Only use PDF URL for print preview - do not fallback to PNG
            const pdfUrl = shipment.label_urls?.pdf;
            const hasPdf = !!pdfUrl;
            console.log('Individual shipment PDF URL check:', {
              shipmentId: shipment.id,
              pdfUrl: pdfUrl,
              hasPDF: !!pdfUrl,
              willShowPrintPreview: !!pdfUrl
            });
            return <tr key={shipment.id || shipment.original_shipment_id || index} className="hover:bg-gray-50">
                  {/* Tracking */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-blue-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shipment.tracking_code || shipment.tracking_number || 'Pending'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {shipment.status === 'success' || shipment.status === 'completed' ? <Badge className="bg-green-100 text-green-800">Completed</Badge> : <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>}
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
                        {shipment.details?.length && shipment.details?.width && shipment.details?.height ? <span>{shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"</span> : <span className="text-gray-400">No dimensions</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {shipment.details?.weight ? <span>{shipment.details.weight} lbs</span> : <span className="text-gray-400">No weight</span>}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {/* Direct Download Button */}
                      <Button
                        onClick={() => handleDirectDownload(shipment)}
                        disabled={!hasPdf}
                        variant="outline"
                        size="sm"
                        className="border-green-200 hover:bg-green-50 text-green-700"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Label
                      </Button>

                      {/* Enhanced Print Preview for individual label */}
                      {pdfUrl && <EnhancedPrintPreview 
                        labelUrl={pdfUrl} 
                        trackingCode={shipment.tracking_code || shipment.tracking_number || ''} 
                        shipmentDetails={{
                          fromAddress: 'Your Saved Pickup Address',
                          toAddress: shipment.customer_address || '',
                          weight: shipment.details?.weight ? `${shipment.details.weight} lbs` : 'N/A',
                          dimensions: shipment.details?.length && shipment.details?.width && shipment.details?.height ? `${shipment.details.length}"×${shipment.details.width}"×${shipment.details.height}"` : 'N/A',
                          service: shipment.service || 'N/A',
                          carrier: shipment.carrier || 'N/A'
                        }} 
                        shipmentId={shipment.id || shipment.original_shipment_id}
                        triggerButton={
                          <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
                            <Eye className="h-3 w-3 mr-1" />
                            Print Preview
                          </Button>
                        }
                      />}
                    </div>
                  </td>
                </tr>;
          })}
          </tbody>
        </table>
      </div>
    </Card>;
};

export default LabelResultsTable;
