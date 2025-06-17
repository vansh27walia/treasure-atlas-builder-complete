
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: File, description: 'Portable Document Format' },
    { value: 'png', label: 'PNG', icon: FileImage, description: 'Portable Network Graphics' },
    { value: 'zpl', label: 'ZPL', icon: FileText, description: 'Zebra Programming Language' },
    { value: 'epl', label: 'EPL', icon: Zap, description: 'Eltron Programming Language' }
  ];

  const handlePrint = () => {
    const consolidatedUrl = batchResult?.consolidatedLabelUrls?.[selectedFormat];
    if (consolidatedUrl) {
      window.print();
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
            <h2 className="text-xl font-semibold mb-4">Consolidated Batch Preview</h2>
            <div className="bg-white border rounded-lg p-4">
              <iframe
                src={batchResult.consolidatedLabelUrls.pdf}
                className="w-full h-96 border-0"
                title="Batch Label Preview"
              />
            </div>
          </Card>
        )}

        {/* Individual Labels Grid */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Labels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {shipment.label_urls?.pdf && (
                    <div className="bg-gray-50 border rounded p-2">
                      <iframe
                        src={shipment.label_urls.pdf}
                        className="w-full h-32 border-0"
                        title={`Label ${index + 1}`}
                      />
                    </div>
                  )}

                  {/* Individual actions */}
                  <div className="flex space-x-2">
                    {shipment.label_urls?.[selectedFormat] && (
                      <Button
                        size="sm"
                        onClick={() => onDownloadSingle(shipment.label_urls[selectedFormat], selectedFormat)}
                        className="flex-1"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrint}
                      className="flex-1"
                    >
                      <Printer className="mr-1 h-3 w-3" />
                      Print
                    </Button>
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
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
