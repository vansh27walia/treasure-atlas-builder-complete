import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { Download, UploadCloud } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BulkShipment } from '@/types/shipping';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import OrderSummary from './OrderSummary';
import ShipmentList from './ShipmentList';
import LabelOptionsModal from './LabelOptionsModal';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import BatchErrorModal from './BatchErrorModal';
import BulkPaymentModal from './BulkPaymentModal';

interface BulkUploadViewProps {
  defaultPickupAddress?: any;
}

const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  defaultPickupAddress
}) => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isPaying,
    isCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    batchError,
    setPickupAddress,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleClearBatchError,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress,
    handlePaymentSuccess,
    showAddPaymentModal,
    setShowAddPaymentModal,
    handleAddPaymentMethod,
  } = useBulkUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  }, [handleFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  } });

  return (
    <div className="space-y-6">
      {/* Header and Upload Form */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold">Bulk Shipping Label Creation</h2>
          <p className="text-gray-500">Upload your CSV or Excel file to create multiple shipping labels at once.</p>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div {...getRootProps()} className={`relative border-2 border-dashed rounded-md p-6 md:p-8 text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2">
          {isDragActive ? "Drop the file here..." : "Drag 'n' drop your file here, or click to select files"}
        </p>
        <p className="text-sm text-gray-400">
          Supported formats: CSV, XLS, XLSX
        </p>
        {file && (
          <div className="mt-4">
            <p className="text-gray-600 font-medium">Selected file: {file.name}</p>
          </div>
        )}
        {uploadStatus === 'uploading' && (
          <Progress value={progress} className="mt-4" />
        )}
        {uploadStatus === 'error' && (
          <p className="text-red-500 mt-2">Upload failed. Please check your file and try again.</p>
        )}
      </div>

      {results && results.processedShipments.length > 0 && (
        <div className="space-y-6">
          {/* Filters and Shipments List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Search by recipient or carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Label htmlFor="carrierFilter" className="text-sm">Filter by Carrier:</Label>
              <Select onValueChange={setSelectedCarrierFilter}>
                <SelectTrigger id="carrierFilter" className="w-[180px]">
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Carriers</SelectItem>
                  {/* Add carrier options dynamically based on available carriers in results */}
                  {Array.from(new Set(results.processedShipments.map(s => s.carrier))).map((carrier: any) => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ShipmentList
            shipments={filteredShipments}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipment}
            onRefreshRates={handleRefreshRates}
            onBulkApplyCarrier={handleBulkApplyCarrier}
            isFetchingRates={isFetchingRates}
          />

          <OrderSummary
            successfulCount={results.successful}
            totalCost={results.totalCost}
            totalInsurance={results.totalInsurance || 0}
            onDownloadAllLabels={handleDownloadAllLabels}
            onProceedToPayment={handlePaymentSuccess}
            onAddPaymentMethod={handleAddPaymentMethod}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
          />
        </div>
      )}

      {/* Add Payment Method Modal */}
      <BulkPaymentModal
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
      />

      {/* Label Options Modal */}
      <LabelOptionsModal
        isOpen={false}
        onClose={() => {}}
        onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
        isCreatingLabels={isCreatingLabels}
      />

      {/* Batch Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={batchPrintPreviewModalOpen}
        onOpenChange={setBatchPrintPreviewModalOpen}
        onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
      />

      {/* Batch Error Modal */}
      {batchError && (
        <BatchErrorModal
          isOpen={!!batchError}
          onClose={handleClearBatchError}
          error={batchError?.error || 'Unknown error'}
          packageNumber={batchError?.packageNumber || 0}
        />
      )}
    </div>
  );
};

export default BulkUploadView;
