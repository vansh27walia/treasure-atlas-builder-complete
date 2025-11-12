import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/sonner';
import { Download, UploadCloud } from 'lucide-react';
import {
  Table,
  TableBody,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BulkShipment } from '@/types/shipping';
import { useBulkUpload } from './useBulkUpload';
import OrderSummary from './OrderSummary';
import BulkPaymentModal from './BulkPaymentModal';
import FreshEditModal from './FreshEditModal';
import IndependentPrintPreview from '../IndependentPrintPreview';

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
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    showAddPaymentModal,
    setShowAddPaymentModal,
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
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    handlePaymentSuccess,
    handleAddPaymentMethod,
    handleEmailLabels,
    // THE CRITICAL FIX: You need to destructure the `setResults` function.
    setResults,
  } = useBulkUpload();

  const promptEmailLabels = () => {
    const email = prompt('Enter email address to email all labels:');
    if (email) {
      handleEmailLabels(email);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Create a synthetic event to match the expected ChangeEvent type
      const syntheticEvent = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(syntheticEvent);
      handleUpload(file);
    }
  }, [handleFileChange, handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    } 
  });

  // Helper function to format address for display
  const formatAddressForDisplay = (address: string | any): string => {
    if (typeof address === 'string') {
      return address;
    }
    if (address && typeof address === 'object') {
      return `${address.street1 || ''}, ${address.city || ''}, ${address.state || ''}`.replace(/^,\s*|,\s*$/g, '');
    }
    return 'Address not available';
  };

  // Insurance: $2 per $100 of declared value (always rounds up)
  const calcInsurance = (declared: number) => (declared > 0 ? Math.ceil(declared / 100) * 2 : 0);

  // ENHANCED edit handler - ensures proper save-then-fetch sequence
  const handleFreshEdit = async (shipmentId: string, updatedShipment: BulkShipment) => {
    console.log('🔄 BulkUploadView: Processing fresh edit for shipment:', shipmentId);
    console.log('📦 Updated data received:', updatedShipment);
    
    try {
      // Use the hook's edit handler which will save and refresh rates properly
      await handleEditShipment(shipmentId, updatedShipment);
      console.log('✅ BulkUploadView: Edit completed successfully');
    } catch (error) {
      console.error('❌ BulkUploadView: Edit failed:', error);
    }
  };

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
          {results && results.processedShipments && results.processedShipments.length > 0 && (
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Print Preview All</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50">
                  <DropdownMenuItem onClick={handleOpenBatchPrintPreview}>Open Print Preview</DropdownMenuItem>
                  <DropdownMenuItem onClick={promptEmailLabels}>Email All Labels</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={promptEmailLabels}>Email All</Button>
            </div>
          )}
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
                  {Array.from(new Set(results.processedShipments.map(s => s.carrier))).map((carrier: any) => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notice: Insurance is auto-calculated */}
          <p className="text-xs text-gray-500">Insurance is automatically calculated at $2 per $100 of declared value.</p>

          {/* Enhanced Shipments Table */}
          <div className="border rounded-lg shadow-lg bg-white">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Recipient</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Carrier</TableHead>
                  <TableHead className="font-semibold">Service</TableHead>
                  <TableHead className="font-semibold">Rate</TableHead>
                  <TableHead className="font-semibold">Insurance</TableHead>
                  <TableHead className="font-semibold bg-green-50 text-green-800">Row Total</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => {
                  const declared = (shipment.declared_value ?? shipment.details?.declared_value ?? 0) as number;
                  const insurance = calcInsurance(declared);
                  const selectedRate = shipment.availableRates?.find((r: any) => r.id === shipment.selectedRateId);
                  const original = selectedRate?.list_rate || selectedRate?.retail_rate;
                  const currentRate = Number(shipment.rate ?? selectedRate?.rate ?? 0);
                  const hasDiscount = original && Number(original) > currentRate;
                  const discountPercent = hasDiscount ? Math.round((1 - currentRate / Number(original)) * 100) : 0;
                  const rowTotal = currentRate + insurance;
                  return (
                    <TableRow key={shipment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{shipment.recipient || shipment.customer_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatAddressForDisplay(shipment.customer_address)}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {shipment.carrier}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {hasDiscount ? (
                          <div className="flex flex-col items-start">
                            <span className="line-through font-semibold text-gray-900">${Number(original).toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-700">${currentRate.toFixed(2)}</span>
                              <span className="text-red-600 font-semibold">{discountPercent}% OFF</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono">${currentRate.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">${insurance.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-bold text-green-700 bg-green-50">
                        ${rowTotal.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FreshEditModal
                            shipment={shipment}
                            pickupAddress={pickupAddress}
                            onUpdateShipment={handleFreshEdit}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveShipment(shipment.id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-gray-100">
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    Grand Total (Shipping + Insurance):
                  </TableCell>
                  <TableCell className="font-bold text-lg text-green-700">
                    ${(() => {
                      const actualTotal = filteredShipments.reduce((sum, shipment) => {
                        const declared = (shipment.declared_value ?? shipment.details?.declared_value ?? 0) as number;
                        const insurance = calcInsurance(declared);
                        const rate = Number(shipment.rate ?? 0);
                        return sum + rate + insurance;
                      }, 0);
                      return actualTotal.toFixed(2);
                    })()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <OrderSummary
            successfulCount={filteredShipments.length}
            totalCost={filteredShipments.reduce((sum, s: any) => {
              const declared = (s.declared_value ?? s.details?.declared_value ?? 0) as number;
              const insurance = calcInsurance(declared);
              const rate = Number(s.rate ?? 0);
              return sum + rate + insurance;
            }, 0)}
            totalInsurance={filteredShipments.reduce((sum, s: any) => {
              const declared = (s.declared_value ?? s.details?.declared_value ?? 0) as number;
              return sum + calcInsurance(declared);
            }, 0)}
            onDownloadAllLabels={handleOpenBatchPrintPreview}
            onProceedToPayment={handlePaymentSuccess}
            onAddPaymentMethod={handleAddPaymentMethod}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
            onEmailAllLabels={promptEmailLabels}
          />

          {/* Independent Print Preview - Simple and Isolated */}
          {results.batchResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Batch Operations</h3>
              <IndependentPrintPreview 
                batchResult={results.batchResult}
                onDownloadComplete={() => console.log('Batch download completed')}
              />
            </div>
          )}
        </div>
      )}

      {/* Pickup (From) Information */}
      {pickupAddress && (
        <div className="mt-6 p-4 rounded-md border bg-gray-50">
          <h4 className="font-semibold mb-2">From (Pickup Address)</h4>
          <p className="text-sm text-gray-700">
            {pickupAddress?.name || pickupAddress?.company} — {formatAddressForDisplay(pickupAddress)}
          </p>
          <div className="mt-2">
            <Button asChild variant="outline" size="sm">
              <a href="/pickup">Change pickup address</a>
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Add Payment Method Modal */}
      <BulkPaymentModal
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
      />
    </div>
  );
};

export default BulkUploadView;
