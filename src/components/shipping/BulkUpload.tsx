import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, XCircle, Package, Download, Loader2, Eye, Mail } from 'lucide-react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BatchPrintPreviewModal } from './bulk-upload/BatchPrintPreviewModal';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './bulk-upload/bulk-upload-table-columns';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CARRIER_OPTIONS } from '@/types/shipping';
import { Heading } from '@/components/ui/heading';

export default function BulkUpload() {
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
    handlePaymentSuccess
  } = useBulkUpload();

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleProceedToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Heading>Bulk Upload Shipments</Heading>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {pickupAddress ? (
            <>
              <FileInput
                id="shipment-file"
                title="Select CSV File"
                description="Upload a CSV file containing shipment details."
                onChange={handleFileChange}
                disabled={isUploading}
              />

              {file && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Selected File: {file.name}
                  </p>
                  <Button
                    onClick={() => handleUpload(file)}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              )}

              {progress > 0 && (
                <div className="mt-4">
                  <Progress value={progress} />
                  <p className="text-sm text-gray-500 mt-1 text-right">
                    {progress}%
                  </p>
                </div>
              )}

              {uploadStatus === 'error' && results?.failedShipments && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Upload Failed</AlertTitle>
                  <AlertDescription>
                    {results.failedShipments.length} shipments failed to upload.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Pickup Address Required</AlertTitle>
              <AlertDescription>
                A pickup address is required to upload shipments.
                <Button variant="link" onClick={handleProceedToSettings}>
                  Add Pickup Address
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    type="search"
                    id="search"
                    placeholder="Search recipients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="carrier-filter">Carrier</Label>
                  <Select value={selectedCarrierFilter} onValueChange={setSelectedCarrierFilter}>
                    <SelectTrigger id="carrier-filter">
                      <SelectValue placeholder="All Carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Carriers</SelectItem>
                      {CARRIER_OPTIONS.map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort-field">Sort By</Label>
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger id="sort-field">
                      <SelectValue placeholder="Recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recipient">Recipient</SelectItem>
                      <SelectItem value="customer_address">Address</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort-direction">Sort Direction</Label>
                  <Select value={sortDirection} onValueChange={setSortDirection}>
                    <SelectTrigger id="sort-direction">
                      <SelectValue placeholder="Ascending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {batchError && (
            <Alert variant="destructive">
              <AlertTitle>Batch Processing Halted</AlertTitle>
              <AlertDescription>
                There was an error processing package #{batchError.packageNumber}: {batchError.error}
                <Button variant="link" onClick={handleClearBatchError}>Clear Error</Button>
              </AlertDescription>
            </Alert>
          )}

          <BulkShipmentsList
            shipments={filteredShipments}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={(shipment) => handleEditShipment(shipment.id, shipment)}
            onRefreshRates={handleRefreshRates}
            pickupAddress={pickupAddress}
          />

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={handleBulkApplyCarrier}
                variant="outline"
                disabled={isFetchingRates || !filteredShipments.length}
              >
                {isFetchingRates ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Rates...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Get All Rates
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleProceedToPayment}
                disabled={isPaying || !filteredShipments.length}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>

              <Button
                onClick={handleCreateLabels}
                disabled={isCreatingLabels || !filteredShipments.length}
              >
                {isCreatingLabels ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Labels...
                  </>
                ) : (
                  'Create Labels'
                )}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Label Generation Progress</AccordionTrigger>
              <AccordionContent>
                {labelGenerationProgress.isGenerating ? (
                  <div className="space-y-4">
                    <p>
                      <strong>Step:</strong> {labelGenerationProgress.currentStep}
                    </p>
                    <Progress value={(labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments) * 100} />
                    <p className="text-sm text-gray-500">
                      Processed: {labelGenerationProgress.processedShipments} / {labelGenerationProgress.totalShipments}
                    </p>
                    <p className="text-sm text-gray-500">
                      Successful: {labelGenerationProgress.successfulShipments}, Failed: {labelGenerationProgress.failedShipments}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estimated time remaining: {labelGenerationProgress.estimatedTimeRemaining} seconds
                    </p>
                  </div>
                ) : (
                  <p>Label generation is not currently in progress.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-between items-center">
            <div>
              {results.batchResult && (
                <Button variant="outline" onClick={handleOpenBatchPrintPreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Batch Print
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadAllLabels}>
                <Download className="w-4 h-4 mr-2" />
                Download All Labels
              </Button>

              <Button variant="outline" onClick={handleEmailLabels}>
                <Mail className="w-4 h-4 mr-2" />
                Email All Labels
              </Button>
            </div>
          </div>

          <BatchPrintPreviewModal
            isOpen={batchPrintPreviewModalOpen}
            onClose={() => setBatchPrintPreviewModalOpen(false)}
            batchResult={results.batchResult}
          />
        </div>
      )}
    </div>
  );
}
