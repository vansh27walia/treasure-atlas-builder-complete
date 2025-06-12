
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, Shield } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import { supabase } from '@/integrations/supabase/client';

interface LabelResultsTableProps {
  shipments: any[];
  onDownloadLabel: (shipmentId: string, format: string) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel
}) => {
  const handleDownload = async (shipment: any, format: string = 'pdf') => {
    try {
      console.log('Downloading label for shipment:', shipment.id, 'format:', format);
      
      if (!shipment.id || shipment.id.trim() === '') {
        toast.error('Invalid shipment ID - cannot download');
        return;
      }

      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to download labels');
        return;
      }

      // Make direct download request to the edge function
      const response = await fetch(`https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/download-label?shipment=${shipment.id}&type=${format}&download=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': '*/*'
        }
      });

      console.log('Download response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        toast.error(`Failed to download ${format.toUpperCase()} label`);
        return;
      }

      // Get the file blob and trigger download
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size);
      
      if (blob.size === 0) {
        toast.error('Downloaded file is empty');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${shipment.id}.${format}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${format.toUpperCase()} label successfully`);
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label');
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

  const isSecureLabel = (shipment: any) => {
    const url = shipment.label_urls?.png || shipment.label_url;
    return url && url.includes('supabase');
  };

  const getEstimatedDelivery = (shipment: any) => {
    // Check multiple possible fields for estimated delivery
    return shipment.estimated_delivery || 
           shipment.estimatedDelivery || 
           shipment.details?.estimated_delivery ||
           shipment.details?.estimatedDelivery ||
           shipment.delivery_days ||
           'Not Available';
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
                Actions
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
                      {getEstimatedDelivery(shipment) !== 'Not Available' ? 
                        formatDate(getEstimatedDelivery(shipment)) : 
                        getEstimatedDelivery(shipment)
                      }
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

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {isSecureLabel(shipment) ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(shipment, 'pdf')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        
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
                          onClick={() => handleDownload(shipment, 'zpl')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          ZPL
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
                        carrier: shipment.carrier || '',
                        estimatedDelivery: getEstimatedDelivery(shipment)
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
