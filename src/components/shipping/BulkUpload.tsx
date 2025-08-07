import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap, Download, Mail, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkLabelDownloadOptions from './bulk-upload/BulkLabelDownloadOptions';
import OrderSummary from './bulk-upload/OrderSummary';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

interface BulkUploadProps {
  onUploadComplete?: (results: BulkUploadResult) => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onUploadComplete }) => {
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl' | 'zip'>('pdf');

  const {
    file,
    isUploading,
    uploadStatus,
    progress,
    handleFileChange,
    handleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const {
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
  } = useShipmentManagement(results, setResults);

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    setResults(uploadResults);
    if (onUploadComplete) {
      onUploadComplete(uploadResults);
    }
  };

  const handleShipmentUpdate = (index: number, updatedShipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = [...results.processedShipments];
    updatedShipments[index] = updatedShipment;
    
    const newTotalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
  };

  const handleShipmentRemove = (index: number) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter((_, i) => i !== index);
    const newTotalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost: newTotalCost
    });
    
    // Update selected shipments
    setSelectedShipments(prev => 
      prev.filter(i => i !== index).map(i => i > index ? i - 1 : i)
    );
    
    toast.success('Shipment removed');
  };

  const handleShipmentToggle = (index: number) => {
    setSelectedShipments(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && results) {
      setSelectedShipments(results.processedShipments.map((_, index) => index));
      setAllSelected(true);
    } else {
      setSelectedShipments([]);
      setAllSelected(false);
    }
  };

  // Update allSelected state when individual selections change
  useEffect(() => {
    if (results && results.processedShipments.length > 0) {
      setAllSelected(selectedShipments.length === results.processedShipments.length);
    }
  }, [selectedShipments, results]);

  const handleCreateLabelsClick = () => {
    handleCreateLabels();
  };

  const getSelectedShipmentsData = () => {
    if (!results) return [];
    return selectedShipments.map(index => results.processedShipments[index]);
  };

  const selectedShipmentsData = getSelectedShipmentsData();
  const selectedTotalCost = selectedShipmentsData.reduce((sum, shipment) => {
    return sum + (shipment.rate || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Upload
              <Badge variant="secondary">CSV Format</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BulkUploadForm
              onUploadSuccess={handleUploadSuccess}
              onUploadFail={(error) => toast.error(error)}
              onPickupAddressSelect={() => {}}
              isUploading={isUploading}
              progress={progress}
              handleUpload={handleUpload}
            />
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-800">{results.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-800">{results.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-800">{selectedShipments.length}</div>
                <div className="text-sm text-gray-600">Selected</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-800">
                  ${selectedTotalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Selected Cost</div>
              </CardContent>
            </Card>
          </div>

          {/* Shipments List */}
          <BulkShipmentsList
            shipments={results.processedShipments}
            onShipmentUpdate={handleShipmentUpdate}
            onShipmentRemove={handleShipmentRemove}
            selectedShipments={selectedShipments}
            onShipmentToggle={handleShipmentToggle}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
          />

          {/* Order Summary and Actions */}
          {selectedShipments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrderSummary 
                successfulCount={selectedShipments.length}
                totalCost={selectedTotalCost}
                totalInsurance={0}
                onDownloadAllLabels={handleDownloadAllLabels}
                onProceedToPayment={handleProceedToPayment}
                isPaying={isPaying}
                isCreatingLabels={isCreatingLabels}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={isPaying || selectedShipments.length === 0}
                    className="w-full"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay & Create Labels (${selectedTotalCost.toFixed(2)})
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleCreateLabelsClick}
                    disabled={isCreatingLabels}
                    className="w-full"
                  >
                    {isCreatingLabels ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Labels...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Labels Only
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadAllLabels()}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Labels
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowLabelOptions(true)}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Labels
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Download Options Modal */}
          {showLabelOptions && results && (
            <BulkLabelDownloadOptions
              processedLabels={selectedShipmentsData}
              onDownloadBatch={(format, url) => window.open(url, '_blank')}
              onDownloadManifest={(url) => window.open(url, '_blank')}
              onDownloadIndividual={handleDownloadSingleLabel}
              onPrintPreview={() => console.log('Print preview')}
              onEmailLabels={() => setShowLabelOptions(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
