
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Mail, Printer, FileText, File, FileImage, Zap } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BulkLabelPrintPageProps {
  batchResult: any;
  shipments: any[];
  onBack: () => void;
  onDownloadSingle: (url: string, format?: string) => void;
  onEmailLabels: (email: string, format: string) => void;
}

const BulkLabelPrintPage: React.FC<BulkLabelPrintPageProps> = ({
  batchResult,
  shipments,
  onBack,
  onDownloadSingle,
  onEmailLabels
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl' | 'epl'>('pdf');
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'vertical'>('grid');

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: File, description: 'Portable Document Format' },
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Portable Network Graphics' },
    { value: 'zpl', label: 'ZPL', icon: FileText, description: 'Zebra Programming Language' },
    { value: 'epl', label: 'EPL', icon: Zap, description: 'Eltron Programming Language' }
  ];

  const handlePrint = () => {
    const consolidatedUrl = batchResult?.consolidatedLabelUrls?.[selectedFormat];
    if (consolidatedUrl) {
      // Open PDF in new window for printing
      const printWindow = window.open(consolidatedUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        toast.error('Popup blocked. Please allow popups and try again.');
      }
    } else {
      toast.error(`${selectedFormat.toUpperCase()} format not available for batch print`);
    }
  };

  const handleDownload = () => {
    const consolidatedUrl = batchResult?.consolidatedLabelUrls?.[selectedFormat];
    if (consolidatedUrl) {
      onDownloadSingle(consolidatedUrl, selectedFormat);
      toast.success(`Downloaded batch labels in ${selectedFormat.toUpperCase()} format`);
    } else {
      toast.error(`${selectedFormat.toUpperCase()} format not available for download`);
    }
  };

  const handleEmail = () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    onEmailLabels(emailAddress, selectedFormat);
    setShowEmailDialog(false);
    setEmailAddress('');
    toast.success(`Batch labels sent to ${emailAddress} in ${selectedFormat.toUpperCase()} format`);
  };

  const handlePrintSingle = (labelUrl: string) => {
    const printWindow = window.open(labelUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error('Popup blocked. Please allow popups and try again.');
    }
  };

  const handleViewInNewTab = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };

  const shipmentsWithLabels = shipments.filter(s => s.label_urls || s.label_url);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Results
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Label Print Preview</h1>
              <p className="text-gray-600 mt-2">
                Preview and manage your {shipmentsWithLabels.length} shipping labels
              </p>
            </div>
            
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              {shipmentsWithLabels.length} Labels Ready
            </Badge>
          </div>
        </div>

        {/* Format Selection & Actions */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Download Format
                </label>
                <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  View Mode
                </label>
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Batch
              </Button>
              
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Batch
              </Button>
              
              <Button
                onClick={() => setShowEmailDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Batch
              </Button>
            </div>
          </div>
        </Card>

        {/* Consolidated Label Preview */}
        {batchResult?.consolidatedLabelUrls?.pdf && (
          <Card className="p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Consolidated Batch Preview</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleViewInNewTab(batchResult.consolidatedLabelUrls.pdf)}
                  variant="outline"
                  size="sm"
                >
                  Open Full Screen
                </Button>
                <Button
                  onClick={() => handlePrintSingle(batchResult.consolidatedLabelUrls.pdf)}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="mr-1 h-3 w-3" />
                  Print
                </Button>
              </div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="w-full h-96 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">PDF Preview</p>
                  <Button
                    onClick={() => handleViewInNewTab(batchResult.consolidatedLabelUrls.pdf)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Full PDF
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Individual Labels */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Labels</h2>
          <div className={viewMode === 'vertical' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {shipmentsWithLabels.map((shipment, index) => (
              <Card key={shipment.id || index} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {shipment.customer_name || shipment.recipient || `Shipment ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {shipment.tracking_code || shipment.tracking_number || 'No tracking'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {shipment.carrier || 'Unknown'}
                    </Badge>
                  </div>

                  {/* Individual label preview */}
                  <div className="bg-gray-50 border rounded p-4">
                    <div className="w-full h-32 bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Label Preview</p>
                      </div>
                    </div>
                  </div>

                  {/* Individual actions */}
                  <div className="flex space-x-2">
                    {(shipment.label_urls?.[selectedFormat] || shipment.label_url) && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleViewInNewTab(shipment.label_urls?.[selectedFormat] || shipment.label_url)}
                          className="flex-1"
                        >
                          View Full
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onDownloadSingle(shipment.label_urls?.[selectedFormat] || shipment.label_url, selectedFormat)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintSingle(shipment.label_urls?.[selectedFormat] || shipment.label_url)}
                          className="flex-1"
                        >
                          <Printer className="mr-1 h-3 w-3" />
                          Print
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Email Dialog */}
        {showEmailDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Email Batch Labels</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Format: {selectedFormat.toUpperCase()}
                  </label>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleEmail} className="flex-1">
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailDialog(false);
                      setEmailAddress('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkLabelPrintPage;
