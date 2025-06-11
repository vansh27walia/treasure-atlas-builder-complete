
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Printer, Eye, ArrowLeft, FileText, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const LabelSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const labelData = location.state?.labelData;

  if (!labelData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Label Data</h2>
          <p className="text-gray-600 mb-4">No shipping label information found.</p>
          <Button onClick={() => navigate('/create-label')}>
            Create New Label
          </Button>
        </Card>
      </div>
    );
  }

  const handleDownload = (format: string = 'pdf') => {
    const url = labelData.label_urls?.[format] || labelData.labelUrl || labelData.label_url;
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = `shipping_label_${labelData.trackingCode || Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${format.toUpperCase()} label`);
  };

  const handlePrint = () => {
    const printUrl = labelData.label_urls?.pdf || labelData.labelUrl || labelData.label_url;
    if (!printUrl) {
      toast.error('No printable label available');
      return;
    }

    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('Unable to open print window. Please check your popup blocker.');
    }
  };

  const handlePreview = () => {
    const previewUrl = labelData.label_urls?.png || labelData.labelUrl || labelData.label_url;
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    } else {
      toast.error('No preview available');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Label Created</h1>
            <p className="text-gray-600">Your shipping label has been successfully generated</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 px-3 py-1">
          <CheckCircle className="h-4 w-4 mr-1" />
          Completed
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Label Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Label Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tracking Number:</span>
                <p className="font-mono text-lg">{labelData.trackingCode || labelData.tracking_code || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Carrier:</span>
                <p>{labelData.carrier || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Service:</span>
                <p>{labelData.service || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rate:</span>
                <p className="text-lg font-semibold text-green-600">
                  ${labelData.rate || labelData.cost || '0.00'}
                </p>
              </div>
              {labelData.delivery_days && (
                <div>
                  <span className="font-medium text-gray-700">Delivery Time:</span>
                  <p>{labelData.delivery_days} business days</p>
                </div>
              )}
            </div>
          </Card>

          {/* Address Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="space-y-4 text-sm">
              {labelData.to_address && (
                <div>
                  <span className="font-medium text-gray-700">Ship To:</span>
                  <div className="mt-1 text-gray-600">
                    <p>{labelData.to_address.name}</p>
                    <p>{labelData.to_address.street1}</p>
                    {labelData.to_address.street2 && <p>{labelData.to_address.street2}</p>}
                    <p>{labelData.to_address.city}, {labelData.to_address.state} {labelData.to_address.zip}</p>
                  </div>
                </div>
              )}
              
              {labelData.from_address && (
                <div>
                  <span className="font-medium text-gray-700">Ship From:</span>
                  <div className="mt-1 text-gray-600">
                    <p>{labelData.from_address.name}</p>
                    <p>{labelData.from_address.street1}</p>
                    {labelData.from_address.street2 && <p>{labelData.from_address.street2}</p>}
                    <p>{labelData.from_address.city}, {labelData.from_address.state} {labelData.from_address.zip}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Label Preview and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Buttons */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Download & Print Options</h3>
            
            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Button 
                onClick={() => handleDownload('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white h-12 flex items-center justify-center"
                disabled={!labelData.label_urls?.pdf && !labelData.labelUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button 
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-700 text-white h-12 flex items-center justify-center"
                disabled={!labelData.label_urls?.pdf && !labelData.labelUrl}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
            </div>
            
            {/* Additional Format Downloads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => handleDownload('png')}
                variant="outline"
                className="flex items-center justify-center"
                disabled={!labelData.label_urls?.png && !labelData.labelUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                PNG
              </Button>
              
              <Button 
                onClick={() => handleDownload('zpl')}
                variant="outline"
                className="flex items-center justify-center"
                disabled={!labelData.label_urls?.zpl}
              >
                <Download className="h-4 w-4 mr-2" />
                ZPL
              </Button>
              
              <Button 
                onClick={handlePreview}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </Card>

          {/* Label Preview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Label Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {labelData.label_urls?.png || labelData.labelUrl || labelData.label_url ? (
                <img
                  src={labelData.label_urls?.png || labelData.labelUrl || labelData.label_url}
                  alt="Shipping Label"
                  className="w-full max-w-md mx-auto border rounded shadow-sm bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No preview available</p>
                </div>
              )}
              <div className="hidden text-center py-12">
                <p className="text-red-500">Failed to load label preview</p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">1</div>
                <p>Print your shipping label on adhesive label paper or regular paper</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">2</div>
                <p>Attach the label securely to your package</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">3</div>
                <p>Drop off your package at the carrier location or schedule a pickup</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">4</div>
                <p>Track your shipment using the tracking number: <span className="font-mono">{labelData.trackingCode || labelData.tracking_code}</span></p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t">
        <div className="text-sm text-gray-600 mb-4 sm:mb-0">
          Label created on {new Date().toLocaleDateString()}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => navigate('/create-label')}>
            Create Another Label
          </Button>
          <Button onClick={() => navigate('/bulk-upload')}>
            Bulk Upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LabelSuccessPage;
