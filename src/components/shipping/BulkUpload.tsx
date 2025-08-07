
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CreditCard, Package, CheckCircle, AlertTriangle, RefreshCcw, FileText, Trash2 } from 'lucide-react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import OrderSummary from './bulk-upload/OrderSummary';
import { useShipmentRates } from '@/hooks/useShipmentRates';

const BulkUpload: React.FC = () => {
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  // Use the shipment rates hook
  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier,
  } = useShipmentRates(results, setResults);

  // Calculate total insurance cost across all shipments
  const calculateTotalInsurance = useCallback((shipments: BulkShipment[]): number => {
    return shipments.reduce((total, shipment) => {
      // Get insurance settings for this shipment (you may need to adapt this based on your insurance logic)
      const insuranceEnabled = shipment.details?.insurance_enabled !== false; // Default to enabled
      const declaredValue = shipment.details?.declared_value || 100; // Default $100
      
      if (!insuranceEnabled) return total;
      
      // Calculate insurance cost based on declared value (matching the logic from BulkShipmentsList)
      let insuranceCost = 0;
      if (declaredValue <= 50) insuranceCost = 1.50;
      else if (declaredValue <= 100) insuranceCost = 2.00;
      else if (declaredValue <= 200) insuranceCost = 3.50;
      else if (declaredValue <= 500) insuranceCost = 7.00;
      else insuranceCost = Math.max(7, declaredValue * 0.015);
      
      return total + insuranceCost;
    }, 0);
  }, []);

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    console.log('Upload successful:', uploadResults);
    setResults(uploadResults);
    toast.success(`Successfully uploaded ${uploadResults.successful} shipments`);
    
    // Automatically fetch rates after successful upload
    if (uploadResults.processedShipments.length > 0) {
      fetchAllShipmentRates(uploadResults.processedShipments);
    }
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Recalculate totals
    const newTotalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const newTotalInsurance = calculateTotalInsurance(updatedShipments);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost: newTotalCost
    });
    
    toast.success('Shipment removed');
  };

  const handleEditShipment = (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) return;
    
    console.log('Editing shipment:', shipmentId, 'with updates:', updates);
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const updatedShipment = { ...shipment, ...updates };
        console.log('Updated shipment:', updatedShipment);
        return updatedShipment;
      }
      return shipment;
    });
    
    // Recalculate totals
    const newTotalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const newTotalInsurance = calculateTotalInsurance(updatedShipments);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost
    });
    
    console.log('Shipment edit completed, results updated');
  };

  const handleRefreshAllRates = async () => {
    if (!results) return;
    
    await fetchAllShipmentRates(results.processedShipments);
  };

  const handleProceedToPayment = async () => {
    if (!results) return;
    
    setIsPaying(true);
    
    try {
      // Calculate final totals including insurance
      const totalShipping = results.totalCost || 0;
      const totalInsurance = calculateTotalInsurance(results.processedShipments);
      const finalTotal = totalShipping + totalInsurance;
      
      console.log('Processing payment:', {
        totalShipping,
        totalInsurance,
        finalTotal,
        shipmentCount: results.processedShipments.length
      });
      
      // Here you would implement actual payment processing
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful payment, automatically proceed to label creation
      setIsPaying(false);
      setIsCreatingLabels(true);
      
      toast.success(`Payment of $${finalTotal.toFixed(2)} processed successfully!`);
      
      // Simulate label creation
      setTimeout(() => {
        setIsCreatingLabels(false);
        toast.success('Labels created successfully! You can now download them.');
      }, 3000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsPaying(false);
    }
  };

  const handleDownloadAllLabels = async () => {
    if (!results) return;
    
    setIsCreatingLabels(true);
    
    try {
      // Simulate label generation and download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('All labels downloaded successfully!');
      setIsCreatingLabels(false);
    } catch (error) {
      console.error('Label download error:', error);
      toast.error('Failed to download labels. Please try again.');
      setIsCreatingLabels(false);
    }
  };

  const handleAIAnalysis = (shipment?: any) => {
    console.log('AI Analysis triggered for shipment:', shipment);
    // You can implement AI analysis logic here
    toast.info('AI Analysis feature coming soon!');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Shipping Upload</h1>
        <p className="text-gray-600">Upload multiple shipments at once for efficient processing</p>
      </div>

      {/* Upload Form */}
      {!results && (
        <BulkUploadForm onUploadSuccess={handleUploadSuccess} />
      )}

      {/* Results Display */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipments List - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Shipments ({results.processedShipments.length})</h2>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefreshAllRates}
                    disabled={isFetchingRates}
                    variant="outline"
                    size="sm"
                  >
                    {isFetchingRates ? (
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4 mr-2" />
                    )}
                    Refresh All Rates
                  </Button>
                  <Button
                    onClick={() => setResults(null)}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    New Upload
                  </Button>
                </div>
              </div>

              <BulkShipmentsList
                shipments={results.processedShipments || []}
                isFetchingRates={isFetchingRates}
                onSelectRate={handleSelectRate}
                onRemoveShipment={handleRemoveShipment}
                onEditShipment={handleEditShipment}
                onRefreshRates={handleRefreshRates}
                onAIAnalysis={handleAIAnalysis}
              />
            </Card>
          </div>

          {/* Order Summary - 1/3 width */}
          <div className="lg:col-span-1">
            <OrderSummary
              successfulCount={results.successful}
              totalCost={results.totalCost || 0}
              totalInsurance={calculateTotalInsurance(results.processedShipments)}
              onProceedToPayment={handleProceedToPayment}
              onDownloadAllLabels={handleDownloadAllLabels}
              isPaying={isPaying}
              isCreatingLabels={isCreatingLabels}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
