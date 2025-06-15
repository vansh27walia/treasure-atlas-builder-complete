
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Truck, Package, MapPin, Calendar, FileText, File, FileImage, Printer, Mail } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';

interface LabelResultsTableProps {
  shipments: any[];
  onDownloadLabel: (url: string) => void;
  getLabelDownloadInfo: (shipment: any) => { url: string; format: string; type: string } | null;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel,
  getLabelDownloadInfo
}) => {
  const handleDownload = (shipment: any, format: string = 'pdf') => {
    console.log('Attempting download for:', { format, shipmentId: shipment.id, labelUrls: shipment.label_urls });
    
    let url = shipment.label_urls?.[format];
    if (!url && format === 'png') {
      url = shipment.label_url;
    }

    if (!url) {
      toast.error(`${format.toUpperCase()} label not available for this shipment.`);
      console.error('URL not found for download:', { format, shipment });
      return;
    }
    onDownloadLabel(url);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Pending';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Pending';
    }
  };

  const getEstimatedDeliveryDate = (shipment: any) => {
    // Try to get delivery date from various possible fields
    return shipment.estimated_delivery_date || 
           shipment.delivery_date || 
           shipment.est_delivery_date ||
           null;
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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Individual Labels</h3>
          <p className="text-sm text-gray-600 mt-1">
            {shipments.length} label{shipments.length !== 1 ? 's' : ''} ready for download and preview
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {shipments.map((shipment, index) => {
          const pdfUrl = shipment.label_urls?.pdf;
          const labelInfo = getLabelDownloadInfo(shipment);
          const estimatedDelivery = getEstimatedDeliveryDate(shipment);
          
          return (
            <Card key={shipment.id || shipment.original_shipment_id || index} className="p-6 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Left Section - Customer & Tracking Info */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Customer Name */}
                  <div className="text-lg font-semibold text-gray-900">
                    {shipment.customer_name || shipment.recipient || 'Customer Name Not Available'}
                  </div>
                  
                  {/* Tracking Number & Estimated Delivery */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {shipment.tracking_code || shipment.tracking_number || 'Pending'}
                      </span>
                    </div>
                    
                    {estimatedDelivery && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Est. Delivery: {formatDate(estimatedDelivery)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Drop-off Address */}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">Drop-off Address:</div>
                      <div>{shipment.customer_address || 'Address not available'}</div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div>
                    {shipment.status === 'success' || shipment.status === 'completed' ? (
                      <Badge className="bg-green-100 text-green-800">Label Ready</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                    )}
                  </div>
                </div>

                {/* Center Section - Carrier Info */}
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-700 mb-2">Carrier Information</div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{shipment.carrier || 'Unknown Carrier'}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Service: {shipment.service || 'Standard'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Package Dimensions & Weight */}
                  <div className="text-sm">
                    <div className="font-semibold text-gray-700 mb-2">Package Details</div>
                    <div className="space-y-1">
                      <div className="text-gray-600">
                        {shipment.details?.length && shipment.details?.width && shipment.details?.height ? (
                          <span>{shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"</span>
                        ) : (
                          <span className="text-gray-400">Dimensions: N/A</span>
                        )}
                      </div>
                      <div className="text-gray-600">
                        {shipment.details?.weight ? (
                          <span>Weight: {shipment.details.weight} lbs</span>
                        ) : (
                          <span className="text-gray-400">Weight: N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Action Buttons */}
                <div className="space-y-3">
                  {/* Download Label Button (Individual) */}
                  <Button
                    onClick={() => handleDownload(shipment, 'pdf')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!labelInfo}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Label (Individual)
                  </Button>
                  
                  {/* Print Preview Button */}
                  {pdfUrl && (
                    <PrintPreview
                      labelUrl={pdfUrl}
                      trackingCode={shipment.tracking_code || shipment.tracking_number || ''}
                      labelUrls={{ 
                        pdf: pdfUrl,
                        png: shipment.label_urls?.png,
                        zpl: shipment.label_urls?.zpl
                      }}
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
                      triggerButton={
                        <Button
                          variant="outline"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Print Preview
                        </Button>
                      }
                    />
                  )}

                  {/* Available Format Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {(shipment.label_urls?.png || shipment.label_url) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'png')}
                        className="text-xs"
                      >
                        <FileImage className="h-3 w-3 mr-1" />
                        PNG
                      </Button>
                    )}
                    
                    {shipment.label_urls?.pdf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'pdf')}
                        className="text-xs"
                      >
                        <File className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    )}
                    
                    {shipment.label_urls?.zpl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(shipment, 'zpl')}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        ZPL
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LabelResultsTable;
