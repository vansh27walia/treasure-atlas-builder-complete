
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Package, MapPin, FileText, CreditCard, Shield, Truck, Globe, CheckCircle, Printer, File, FileArchive } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';

interface LabelCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: {
    labelUrl?: string;
    trackingCode?: string;
    shipmentId?: string;
    carrier?: string;
    service?: string;
    cost?: number;
    estimatedDelivery?: string;
    fromAddress?: any;
    toAddress?: any;
    isInternational?: boolean;
    customsInfo?: any;
  } | null;
}

const LabelCreationModal: React.FC<LabelCreationModalProps> = ({
  isOpen,
  onClose,
  labelData
}) => {
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [createdLabel, setCreatedLabel] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');

  if (!labelData) return null;

  const { isInternational, fromAddress, toAddress, customsInfo } = labelData;

  const handleCreateLabel = async () => {
    if (!labelData.shipmentId) {
      toast.error('Missing shipment information');
      return;
    }

    setIsCreatingLabel(true);
    try {
      // Use the appropriate endpoint based on shipping type
      const endpoint = isInternational ? 'create-international-label' : 'create-label';
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          shipmentId: labelData.shipmentId,
          rateId: labelData.carrier, // This should be the rate ID
          options: {
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setCreatedLabel(data);
      toast.success(`${isInternational ? 'International' : 'Domestic'} shipping label created successfully!`);
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create shipping label');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleDownloadLabel = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (createdLabel?.labelUrl || labelData.labelUrl) {
      const url = createdLabel?.labelUrl || labelData.labelUrl;
      window.open(url, '_blank');
      toast.success(`Downloading ${format.toUpperCase()} label`);
    }
  };

  const handleViewTracking = () => {
    const trackingNumber = createdLabel?.trackingCode || labelData.trackingCode;
    if (trackingNumber) {
      // Navigate to tracking page
      window.location.href = `/dashboard?tab=tracking&tracking=${trackingNumber}`;
    }
  };

  // Use created label data if available, otherwise use labelData
  const displayTrackingCode = createdLabel?.trackingCode || labelData.trackingCode;
  const displayLabelUrl = createdLabel?.labelUrl || labelData.labelUrl;
  const hasLabel = displayLabelUrl && displayTrackingCode;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className={`${isInternational ? 'max-w-7xl max-h-screen' : 'max-w-4xl max-h-[90vh]'} overflow-y-auto`}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isInternational ? 'bg-blue-100' : 'bg-green-100'}`}>
              {isInternational ? (
                <Globe className="w-5 h-5 text-blue-600" />
              ) : (
                <Package className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {isInternational ? 'International' : 'Domestic'} Label Creation
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {isInternational 
                  ? 'Complete international shipping with customs documentation'
                  : 'Create and download your shipping label'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className={`${isInternational ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}`}>
          {/* Shipment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Shipment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Details */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Service Details
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{labelData.carrier?.toUpperCase()} - {labelData.service}</span>
                    <Badge variant="outline">{isInternational ? 'International' : 'Domestic'}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Cost: ${labelData.cost?.toFixed(2)}
                  </div>
                  {labelData.estimatedDelivery && (
                    <div className="text-sm text-gray-600">
                      Estimated Delivery: {labelData.estimatedDelivery}
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {displayTrackingCode && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Tracking Information
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-medium text-blue-800 mb-1">Tracking Number:</div>
                    <div className="text-lg font-mono bg-white px-3 py-2 rounded border border-blue-200">
                      {displayTrackingCode}
                    </div>
                    <Button
                      onClick={handleViewTracking}
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                    >
                      View Tracking Details
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* International Customs Information */}
          {isInternational && customsInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Customs Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Contents Type:</span>
                      <span className="ml-2 capitalize">{customsInfo.contents_type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Signer:</span>
                      <span className="ml-2">{customsInfo.customs_signer}</span>
                    </div>
                    <div>
                      <span className="font-medium">Items:</span>
                      <span className="ml-2">{customsInfo.customs_items?.length || 0} item(s)</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Value:</span>
                      <span className="ml-2">
                        ${customsInfo.customs_items?.reduce((sum: number, item: any) => sum + (item.value * item.quantity), 0).toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customs Items */}
                <div>
                  <h5 className="font-medium mb-2">Declared Items</h5>
                  <div className="space-y-2">
                    {customsInfo.customs_items?.map((item: any, index: number) => (
                      <div key={index} className="bg-white border p-3 rounded-lg text-sm">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-gray-600">
                          Qty: {item.quantity} | Value: ${item.value} | Weight: {item.weight}oz
                        </div>
                        {item.hs_tariff_number && (
                          <div className="text-gray-600">HS Code: {item.hs_tariff_number}</div>
                        )}
                      </div>
                    )) || []}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insurance & Payment */}
          <Card className={isInternational ? 'lg:col-span-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Insurance & Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Package insured for ${labelData.cost?.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Coverage includes loss and damage protection</div>
                  </div>
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Label Actions */}
          <Card className={isInternational ? 'lg:col-span-2' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Label Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasLabel ? (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Create Label</h3>
                  <p className="text-gray-600 mb-4">
                    {isInternational 
                      ? 'Your international shipment is ready with all customs documentation complete.'
                      : 'Your domestic shipment is ready for label creation.'
                    }
                  </p>
                  <Button
                    onClick={handleCreateLabel}
                    disabled={isCreatingLabel}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingLabel ? 'Creating Label...' : `Create ${isInternational ? 'International' : 'Domestic'} Label`}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-green-100 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Label Created Successfully!</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Tracking Number: {displayTrackingCode}
                    </div>
                  </div>

                  <Tabs defaultValue="download" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="download">Download Options</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="download">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div 
                            className={`p-4 border-2 rounded-md text-center cursor-pointer transition-colors
                              ${selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                            `}
                            onClick={() => setSelectedFormat('pdf')}
                          >
                            <File className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <h4 className="font-medium">PDF Format</h4>
                            <p className="text-xs text-gray-500">Best for printing</p>
                          </div>
                          
                          <div 
                            className={`p-4 border-2 rounded-md text-center cursor-pointer transition-colors
                              ${selectedFormat === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}
                            `}
                            onClick={() => setSelectedFormat('png')}
                          >
                            <File className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <h4 className="font-medium">PNG Format</h4>
                            <p className="text-xs text-gray-500">Image format</p>
                          </div>
                          
                          <div 
                            className={`p-4 border-2 rounded-md text-center cursor-pointer transition-colors
                              ${selectedFormat === 'zpl' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                            `}
                            onClick={() => setSelectedFormat('zpl')}
                          >
                            <FileArchive className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                            <h4 className="font-medium">ZPL Format</h4>
                            <p className="text-xs text-gray-500">For thermal printers</p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleDownloadLabel(selectedFormat)} 
                          className={`w-full h-12 ${
                            selectedFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 
                            selectedFormat === 'png' ? 'bg-green-600 hover:bg-green-700' : 
                            'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Download {selectedFormat.toUpperCase()} File
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview">
                      <div className="min-h-[400px] flex items-center justify-center border rounded-md p-4">
                        {displayLabelUrl ? (
                          <iframe 
                            src={displayLabelUrl} 
                            className="w-full h-[500px]" 
                            title="Label Preview"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full w-full">
                            <FileText className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-gray-500">Label preview not available</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-3 justify-center mt-4">
                    <Button
                      onClick={handleViewTracking}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      Track Package
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelCreationModal;
