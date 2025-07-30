
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Package, Truck } from 'lucide-react';
import BulkUploadForm from '@/components/shipping/bulk-upload/BulkUploadForm';
import AIRatePicker from '@/components/shipping/bulk-upload/AIRatePicker';
import EnhancedBulkRateDisplay from '@/components/shipping/bulk-upload/EnhancedBulkRateDisplay';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentRates } from '@/hooks/useShipmentRates';

const BulkUploadPage = () => {
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'rates' | 'payment'>('upload');
  
  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier,
  } = useShipmentRates(results, setResults);

  const handleUploadSuccess = (uploadResults: any) => {
    console.log('Upload complete:', uploadResults);
    setResults(uploadResults);
    setCurrentStep('rates');
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    console.log('Pickup address selected:', address);
  };

  const handleFetchRates = async () => {
    if (results?.processedShipments) {
      await fetchAllShipmentRates(results.processedShipments);
    }
  };

  const handleAIRateSelection = (shipmentId: string, rateId: string) => {
    handleSelectRate(shipmentId, rateId);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
      'John Doe,Acme Corp,123 Main St,Suite 100,New York,NY,10001,US,555-1234,10,8,6,2',
      'Jane Smith,Tech Inc,456 Oak Ave,,Los Angeles,CA,90210,US,555-5678,12,10,8,3',
      'Bob Johnson,,789 Pine Rd,,Chicago,IL,60601,US,555-9012,8,6,4,1'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_shipping_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Bulk Label Creation
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Upload your CSV file with shipping addresses and create multiple labels at once with competitive rates.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            currentStep === 'upload' ? 'bg-blue-100 text-blue-800' : 
            results ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <Upload className="w-4 h-4" />
            <span className="font-medium">1. Upload CSV</span>
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            currentStep === 'rates' ? 'bg-blue-100 text-blue-800' : 
            currentStep === 'payment' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <Truck className="w-4 h-4" />
            <span className="font-medium">2. Select Rates</span>
          </div>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            currentStep === 'payment' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <Package className="w-4 h-4" />
            <span className="font-medium">3. Generate Labels</span>
          </div>
        </div>
      </div>

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {/* Sample CSV Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Sample CSV Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Download our sample CSV template to see the required format for bulk uploads.
              </p>
              <Button onClick={downloadSampleCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </CardContent>
          </Card>

          {/* Upload Form */}
          <BulkUploadForm 
            onUploadSuccess={handleUploadSuccess}
            onUploadFail={handleUploadFail}
            onPickupAddressSelect={handlePickupAddressSelect}
          />
        </div>
      )}

      {/* Rates Step */}
      {currentStep === 'rates' && results && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Review Shipping Rates
              </h2>
              <p className="text-gray-600">
                {results.processedShipments.length} shipments processed
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleFetchRates}
                disabled={isFetchingRates}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isFetchingRates ? 'Fetching...' : 'Fetch Live Rates'}
              </Button>
              
              <Button
                onClick={() => setCurrentStep('payment')}
                disabled={!results.processedShipments.every(s => s.selectedRateId)}
                className="bg-green-600 hover:bg-green-700"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>

          {/* AI Rate Picker */}
          <AIRatePicker
            shipments={results.processedShipments}
            onApplyAISelection={handleAIRateSelection}
          />

          {/* Enhanced Rate Display for Each Shipment */}
          <div className="space-y-4">
            {results.processedShipments.map((shipment) => (
              <EnhancedBulkRateDisplay
                key={shipment.id}
                shipment={shipment}
                onRateSelect={handleSelectRate}
                onRefreshRates={handleRefreshRates}
                isRefreshing={isFetchingRates}
                itemValue={200} // You can make this configurable per shipment
              />
            ))}
          </div>

          {/* Summary Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Total Cost Summary
                  </h3>
                  <p className="text-blue-700">
                    {results.processedShipments.length} shipments
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    ${results.totalCost?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-sm text-blue-600">
                    Including insurance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Step */}
      {currentStep === 'payment' && results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Payment processing functionality will be implemented here.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BulkUploadPage;
