
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle, XCircle, Edit, Save, X, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import AIRateSidebar from '../AIRateSidebar';
import DynamicDiscountBadge from '../DynamicDiscountBadge';
import { toast } from '@/components/ui/sonner';

const ImprovedBulkUploadView: React.FC = () => {
  const {
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    handleUpload,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  const [showManualCSV, setShowManualCSV] = useState(false);
  const [manualCSVData, setManualCSVData] = useState('');
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [selectedShipmentForAI, setSelectedShipmentForAI] = useState<any>(null);
  const [editingShipment, setEditingShipment] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        // Process the CSV content here
        await handleUpload();
      }
    };
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    reader.readAsText(selectedFile);
  };

  const handleManualCSVSubmit = async () => {
    if (!manualCSVData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    try {
      // Create a blob from manual CSV data
      const blob = new Blob([manualCSVData], { type: 'text/csv' });
      const file = new File([blob], 'manual-data.csv', { type: 'text/csv' });
      
      setSelectedFile(file);
      setShowManualCSV(false);
      setManualCSVData('');
      
      // Trigger upload
      setTimeout(() => {
        handleFileUpload();
      }, 100);
      
    } catch (error) {
      console.error('Manual CSV processing error:', error);
      toast.error('Failed to process manual CSV data');
    }
  };

  const handleRateClick = (shipment: any) => {
    setSelectedShipmentForAI(shipment);
    setAiSidebarOpen(true);
  };

  const calculateInsurance = (declaredValue: number) => {
    if (declaredValue <= 0) declaredValue = 100; // Default to $100 if zero or blank
    return Math.ceil(declaredValue / 100) * 2; // $2 per $100
  };

  const handleAIRateSelect = (rateId: string) => {
    if (selectedShipmentForAI) {
      handleSelectRate(selectedShipmentForAI.id, rateId);
      const newSelectedRate = selectedShipmentForAI.availableRates?.find((r: any) => r.id === rateId);
      if (newSelectedRate) {
        setSelectedShipmentForAI({
          ...selectedShipmentForAI,
          selectedRateId: rateId,
          carrier: newSelectedRate.carrier,
          service: newSelectedRate.service,
          rate: parseFloat(newSelectedRate.rate)
        });
      }
    }
  };

  // Close AI sidebar when payment is clicked
  useEffect(() => {
    if (isPaying || isCreatingLabels) {
      setAiSidebarOpen(false);
    }
  }, [isPaying, isCreatingLabels]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Label Creation</h1>
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* Upload Section */}
      {uploadStatus === 'idle' && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Your CSV File</h3>
                <p className="text-gray-600 mb-4">
                  Select a CSV file with shipping information or paste data manually
                </p>
                <div className="flex gap-3 justify-center">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Choose File
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualCSV(true)}
                  >
                    Manual Entry
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <Button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      className="mt-2 w-full"
                    >
                      {isUploading ? 'Processing...' : 'Upload & Process'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual CSV Entry Modal */}
      {showManualCSV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manual CSV Data Entry</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualCSV(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csvData">Paste CSV Data</Label>
                <Textarea
                  id="csvData"
                  value={manualCSVData}
                  onChange={(e) => setManualCSVData(e.target.value)}
                  placeholder="name,street1,city,state,zip,country,weight,length,width,height,company,street2,phone,email,reference&#10;John Doe,123 Main St,Los Angeles,CA,90001,US,5.0,10,5,5,Acme Corp,,555-555-5555,john@example.com,Order #1234"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManualCSV(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleManualCSVSubmit}>
                  Process Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="font-medium">Processing your shipments...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">
                This may take a few moments depending on the number of shipments
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && uploadStatus === 'editing' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-800">{results.successful}</p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-800">{results.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-800">${results.totalCost.toFixed(2)}</p>
                    <p className="text-sm text-blue-600">Total Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search shipments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCarrierFilter === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCarrierFilter('')}
                  >
                    All Carriers
                  </Button>
                  <Button
                    variant={selectedCarrierFilter === 'USPS' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCarrierFilter('USPS')}
                  >
                    USPS
                  </Button>
                  <Button
                    variant={selectedCarrierFilter === 'UPS' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCarrierFilter('UPS')}
                  >
                    UPS
                  </Button>
                  <Button
                    variant={selectedCarrierFilter === 'FedEx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCarrierFilter('FedEx')}
                  >
                    FedEx
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shipments ({filteredShipments.length})</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkApplyCarrier('USPS')}
                    disabled={isFetchingRates}
                  >
                    Apply USPS to All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkApplyCarrier('UPS')}
                    disabled={isFetchingRates}
                  >
                    Apply UPS to All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Recipient</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Address</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Package</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rate</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Insurance</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{shipment.recipient}</p>
                            {shipment.details?.company && (
                              <p className="text-sm text-gray-500">{shipment.details.company}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>
                            <p>{shipment.details?.street1}</p>
                            <p>{shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div>
                            <p>{shipment.details?.parcel_weight}lbs</p>
                            <p className="text-gray-500">
                              {shipment.details?.parcel_length}×{shipment.details?.parcel_width}×{shipment.details?.parcel_height}in
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div 
                            className="cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            onClick={() => handleRateClick(shipment)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">${shipment.rate.toFixed(2)}</span>
                              <DynamicDiscountBadge 
                                rate={shipment.availableRates?.find(r => r.id === shipment.selectedRateId) || shipment}
                                size="sm"
                              />
                              <Brain className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600">{shipment.carrier} {shipment.service}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">${calculateInsurance(shipment.details?.declared_value || 100).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              ${shipment.details?.declared_value || 100} declared
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingShipment(shipment.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveShipment(shipment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleCreateLabels}
              disabled={isCreatingLabels || results.processedShipments.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingLabels ? 'Creating Labels...' : `Create ${results.processedShipments.length} Labels - $${results.totalCost.toFixed(2)}`}
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadStatus === 'success' && results && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Labels Created Successfully!</h3>
                <p className="text-green-600">All shipping labels have been generated</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownloadAllLabels}>
                Download All Labels
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadLabelsWithFormat('pdf')}
              >
                Download as PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Sidebar */}
      <AIRateSidebar
        isOpen={aiSidebarOpen}
        onClose={() => setAiSidebarOpen(false)}
        selectedRate={selectedShipmentForAI?.availableRates?.find((r: any) => r.id === selectedShipmentForAI?.selectedRateId)}
        allRates={selectedShipmentForAI?.availableRates || []}
        onRateSelect={handleAIRateSelect}
      />

      {/* Main content overlay when sidebar is open */}
      {aiSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setAiSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ImprovedBulkUploadView;
