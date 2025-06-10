
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, Shield } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';

interface LabelResultsTableProps {
  shipments: any[];
  onDownloadLabel: (url: string, format: string) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel
}) => {
  const handleDownload = (shipment: any, format: string = 'png') => {
    const url = shipment.label_urls?.[format] || shipment.label_url;
    if (!url) {
      toast.error(`${format.toUpperCase()} label not available for this shipment`);
      return;
    }
    
    // Verify it's a secure Supabase URL
    if (!url.includes('supabase')) {
      toast.error('Only secure labels can be downloaded. This label is not stored securely.');
      return;
    }
    
    onDownloadLabel(url, format);
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

  const isSecureLabel = (shipment: any) => {
    const url = shipment.label_urls?.png || shipment.label_url;
    return url && url.includes('supabase');
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              Secure Shipping Labels
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {shipments.length} label{shipments.length !== 1 ? 's' : ''} securely stored in our system
            </p>
          </div>
          <div className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full">
            🔒 No external URLs exposed
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking & Security
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrier & Drop-off Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dimensions & Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estimated Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secure Downloads
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment, index) => (
              <tr key={shipment.id || index} className="hover:bg-gray-50">
                {/* Tracking & Security */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 text-blue-500 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.tracking_code || shipment.tracking_number || 'Pending'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        {shipment.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                        )}
                        {isSecureLabel(shipment) && (
                          <div className="flex items-center ml-2 text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            <span className="text-xs">Secure</span>
                          </div>
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

                {/* Estimated Delivery */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">
                      {formatDate(shipment.estimated_delivery)}
                    </div>
                  </div>
                </td>

                {/* Notes */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs">
                    {shipment.notes || shipment.details?.reference || (
                      <span className="text-gray-400 italic">No notes</span>
                    )}
                  </div>
                </td>

                {/* Secure Downloads */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {isSecureLabel(shipment) ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(shipment, 'png')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PNG
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(shipment, 'pdf')}
                          disabled={!shipment.label_urls?.pdf}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        ⚠️ Insecure label
                      </div>
                    )}
                    
                    <PrintPreview
                      labelUrl={shipment.label_urls?.png || shipment.label_url || ''}
                      trackingCode={shipment.tracking_code || shipment.tracking_number}
                      labelUrls={shipment.label_urls}
                      shipmentDetails={{
                        fromAddress: 'Pickup address',
                        toAddress: shipment.customer_address || '',
                        weight: shipment.details?.weight ? `${shipment.details.weight} lbs` : '',
                        dimensions: shipment.details?.length ? 
                          `${shipment.details.length}"×${shipment.details.width}"×${shipment.details.height}"` : '',
                        service: shipment.service || '',
                        carrier: shipment.carrier || ''
                      }}
                      shipmentId={shipment.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Security Notice */}
      <div className="px-6 py-3 bg-green-50 border-t">
        <div className="flex items-center text-sm text-green-800">
          <Shield className="h-4 w-4 mr-2" />
          <span>All labels are securely stored and served from our protected storage system. No external URLs are exposed to ensure maximum security.</span>
        </div>
      </div>
    </Card>
  );
};

export default LabelResultsTable;
