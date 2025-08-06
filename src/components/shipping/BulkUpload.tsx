import React from 'react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import BulkUploadHeader from './BulkUploadHeader';
import BulkUploadProgressBar from './BulkUploadProgressBar';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';

const BulkUpload = () => {
  const {
    isUploading,
    progress,
    results,
    handleUpload,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    pickupAddress,
    setPickupAddress,
    handleCreateLabels
  } = useBulkUpload();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BulkUploadHeader 
        onDownloadTemplate={handleDownloadTemplate}
        onFileSelect={handleUpload}
        isUploading={isUploading}
        pickupAddress={pickupAddress}
        setPickupAddress={setPickupAddress}
      />

      {isUploading && (
        <BulkUploadProgressBar progress={progress} />
      )}

      {results && (
        <BulkShipmentsList
          results={results}
          isFetchingRates={isUploading}
          onSelectRate={handleSelectRate}
          onRemoveShipment={handleRemoveShipment}
          onEditShipment={(shipmentId: string, details: any) => {
            if (!results) return;
            
            const updatedShipments = results.processedShipments.map(s => {
              return s.id === shipmentId ? { ...s, ...details } : s;
            });
            
            setResults({
              ...results,
              processedShipments: updatedShipments
            });
          }}
          onRefreshRates={handleRefreshRates}
          onAIAnalysis={handleCreateLabels}
        />
      )}
    </div>
  );
};

export default BulkUpload;
