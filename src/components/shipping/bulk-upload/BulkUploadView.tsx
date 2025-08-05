
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileSpreadsheet } from 'lucide-react';
import BulkUploadHeader from './BulkUploadHeader';
import CSVUploader from './CSVUploader';
import CsvHeaderMapper from './CsvHeaderMapper';
import BulkShipmentsList from './BulkShipmentsList';
import BulkResults from './BulkResults';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { useBulkUpload } from './useBulkUpload';

const BulkUploadView: React.FC = () => {
  const {
    uploadStatus,
    shipments,
    updateShipment,
    processCSV,
    fetchRates,
    selectRate,
    createLabels,
    results,
    error,
    pickupAddress
  } = useBulkUpload();

  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);

  const handleShipmentSelect = useCallback((index: number, selected: boolean) => {
    setSelectedShipments(prev => 
      selected 
        ? [...prev, index]
        : prev.filter(i => i !== index)
    );
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    if (action === 'ready' && selectedShipments.length > 0) {
      const selectedShipmentData = selectedShipments.map(index => shipments[index]);
      createLabels(selectedShipmentData);
    }
  }, [selectedShipments, shipments, createLabels]);

  const renderContent = () => {
    switch (uploadStatus) {
      case 'idle':
        return (
          <div className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your CSV File</h3>
            <p className="text-gray-600 mb-6">
              Upload a CSV file with your shipping data to get started with bulk label creation.
            </p>
            <CSVUploader onUpload={processCSV} />
          </div>
        );

      case 'uploading':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Processing CSV File</h3>
            <p className="text-gray-600">Analyzing your shipping data...</p>
          </div>
        );

      case 'editing':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">CSV Uploaded Successfully</h3>
                <p className="text-blue-700 text-sm">Review and edit your shipments before fetching rates</p>
              </div>
            </div>
            <CsvHeaderMapper onMappingComplete={fetchRates} />
          </div>
        );

      case 'rates_fetching':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fetching Shipping Rates</h3>
            <p className="text-gray-600">Getting the best rates for your shipments...</p>
          </div>
        );

      case 'rate_selection':
        return (
          <BulkShipmentsList
            shipments={shipments}
            onShipmentUpdate={updateShipment}
            onShipmentSelect={handleShipmentSelect}
            selectedShipments={selectedShipments}
            onBulkAction={handleBulkAction}
            pickupAddress={pickupAddress}
          />
        );

      case 'creating-labels':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Labels</h3>
            <p className="text-gray-600">Generating shipping labels for your selected shipments...</p>
          </div>
        );

      case 'success':
        return results ? <BulkResults results={results} /> : null;

      case 'error':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || 'An error occurred during bulk upload processing'}
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <BulkUploadHeader currentStep={uploadStatus} />
      
      <Card className="mt-6 p-6">
        {renderContent()}
      </Card>
    </div>
  );
};

export default BulkUploadView;
