
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, File, FileImage } from 'lucide-react';
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
    console.log('Attempting download for:', { format, shipment: shipment.id, labelUrls: shipment.label_urls });
    
    // Get URL from our stored label URLs (never EasyPost URLs)
    let url = '';
    if (shipment.label_urls && typeof shipment.label_urls === 'object') {
      url = shipment.label_urls[format] || '';
    }
    
    // Fallback to main label_url if specific format not found
    if (!url && format === 'png') {
      url = shipment.label_url || '';
    }
    
    if (!url || url.trim() === '') {
      toast.error(`${format.toUpperCase()} label not available for this shipment`);
      return;
    }
    
    // Ensure we never use EasyPost URLs
    if (url.includes('easypost.com')) {
      toast.error('EasyPost URLs are not allowed. Please regenerate labels.');
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

  const getAvailableFormats = (shipment: any) => {
    const formats = [];
    
    if (shipment.label_urls && typeof shipment.label_urls === 'object') {
      if (shipment.label_urls.png) formats.push('png');
      if (shipment.label_urls.pdf) formats.push('pdf');
      if (shipment.label_urls.zpl) formats.push('zpl');
    } else if (shipment.label_url) {
      formats.push('png'); // Fallback
    }
    
    return formats;
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
                Carrier & Customer Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package Info
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
            {shipments.map((shipment, index) => {
              const availableFormats = getAvailableFormats(shipment);
              
              return (
                <tr key={shipment.id || index} className="hover:bg-gray-50">
                  {/* Tracking */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-blue-500 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shipment.tracking_code || shipment.tracking_number || 'Pending'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {shipment.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Carrier & Customer Details */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.carrier || 'Unknown Carrier'} - {shipment.service || 'Unknown Service'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>To:</strong> {shipment.customer_name || shipment.recipient || 'No recipient name'}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs">
                        {shipment.customer_address || 'No address available'}
                      </div>
                    </div>
                  </td>

                  {/* Package Info */}
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
                      <div className="text-sm text-green-600 font-medium">
                        ${typeof shipment.rate === 'number' ? shipment.rate.toFixed(2) : shipment.rate || '0.00'}
                      </div>
                    </div>
                  </td>

                  {/* Available Formats */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {availableFormats.includes('png') && (
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
                      
                      {availableFormats.includes('pdf') && (
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
                      
                      {availableFormats.includes('zpl') && (
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
                      
                      {availableFormats.length === 0 && (
                        <span className="text-xs text-gray-400 italic">No formats available</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(shipment, availableFormats[0] || 'png')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={availableFormats.length === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      
                      {availableFormats.length > 0 && (
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
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LabelResultsTable;
