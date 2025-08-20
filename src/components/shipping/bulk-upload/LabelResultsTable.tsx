
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import EnhancedPrintPreview from '@/components/shipping/EnhancedPrintPreview';

interface LabelResultsTableProps {
  shipments: BulkShipment[];
  onDownloadLabel: (labelUrl: string, format?: string) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({ 
  shipments, 
  onDownloadLabel 
}) => {
  
  const handleDownloadPDF = (shipment: BulkShipment) => {
    // Priority order: label_urls.pdf > label_url > label_urls.png
    const pdfUrl = shipment.label_urls?.pdf || shipment.label_url;
    
    if (pdfUrl && pdfUrl.trim() !== '') {
      // Create a temporary link for PDF download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `shipping_label_${shipment.tracking_code || shipment.id}_${Date.now()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF label downloaded');
    } else {
      toast.error('PDF label not available for this shipment');
    }
  };

  const handleDownloadPNG = (shipment: BulkShipment) => {
    const pngUrl = shipment.label_urls?.png || shipment.label_url;
    
    if (pngUrl && pngUrl.trim() !== '') {
      onDownloadLabel(pngUrl, 'png');
    } else {
      toast.error('PNG label not available for this shipment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Package className="h-3 w-3 mr-1" />Processing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Tracking Code</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment, index) => {
            const hasLabel = !!(shipment.label_url || shipment.label_urls?.pdf || shipment.label_urls?.png);
            const labelUrl = shipment.label_urls?.pdf || shipment.label_url || shipment.label_urls?.png || '';
            
            return (
              <TableRow key={shipment.id || index}>
                <TableCell>
                  <div>
                    <div className="font-medium">{shipment.customer_name || `Customer ${index + 1}`}</div>
                    <div className="text-sm text-gray-500">{shipment.toAddress?.city}, {shipment.toAddress?.state}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">
                    {shipment.tracking_code || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {shipment.carrier} {shipment.service}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(shipment.status || 'processing')}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    ${shipment.rate?.toFixed(2) || '0.00'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {hasLabel ? (
                      <>
                        {/* Print Preview Button */}
                        <EnhancedPrintPreview
                          labelUrl={labelUrl}
                          trackingCode={shipment.tracking_code}
                          shipmentId={shipment.id}
                          triggerButton={
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-200 hover:bg-purple-50 text-purple-700 h-8"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          }
                        />
                        
                        {/* PDF Download Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(shipment)}
                          className="border-blue-200 hover:bg-blue-50 text-blue-700 h-8"
                          disabled={!shipment.label_urls?.pdf && !shipment.label_url}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        
                        {/* PNG Download Button */}
                        {(shipment.label_urls?.png || shipment.label_url) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPNG(shipment)}
                            className="border-green-200 hover:bg-green-50 text-green-700 h-8"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PNG
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">No label available</div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabelResultsTable;
