
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, FileText, File, FileImage, Package2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface LabelData {
  id: string;
  tracking_code: string;
  label_urls: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  carrier: string;
  service: string;
  customer_name: string;
  customer_address: string;
  rate: number;
  status: 'completed' | 'failed';
  error?: string;
}

interface LabelBatchDisplayProps {
  labels: LabelData[];
  onDownloadSingle: (url: string, format: string, filename: string) => void;
  onDownloadAll: (format: string) => void;
  onPrintPreview: () => void;
}

const LabelBatchDisplay: React.FC<LabelBatchDisplayProps> = ({
  labels,
  onDownloadSingle,
  onDownloadAll,
  onPrintPreview
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'pdf' | 'zpl'>('png');
  
  const successfulLabels = labels.filter(label => label.status === 'completed');
  const failedLabels = labels.filter(label => label.status === 'failed');

  const formatIcons = {
    png: FileImage,
    pdf: File,
    zpl: FileText
  };

  const formatColors = {
    png: 'bg-green-100 text-green-700 border-green-300',
    pdf: 'bg-blue-100 text-blue-700 border-blue-300',
    zpl: 'bg-purple-100 text-purple-700 border-purple-300'
  };

  const handleDownloadSingle = (label: LabelData, format: 'png' | 'pdf' | 'zpl') => {
    const url = label.label_urls[format];
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available for this label`);
      return;
    }
    
    const filename = `label_${label.tracking_code}_${format}.${format}`;
    onDownloadSingle(url, format, filename);
  };

  const availableFormats = ['png', 'pdf', 'zpl'].filter(format => 
    successfulLabels.some(label => label.label_urls[format as keyof typeof label.label_urls])
  );

  return (
    <div className="space-y-6">
      {/* Batch Actions */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Batch Complete: {successfulLabels.length} Labels Generated
            </h3>
            <p className="text-sm text-gray-600">
              Total cost: ${successfulLabels.reduce((sum, label) => sum + label.rate, 0).toFixed(2)}
              {failedLabels.length > 0 && ` • ${failedLabels.length} failed`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onPrintPreview}
              variant="outline"
              className="flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>Print Preview</span>
            </Button>

            {availableFormats.map(format => (
              <Button
                key={format}
                onClick={() => onDownloadAll(format)}
                className={`flex items-center space-x-1 ${formatColors[format as keyof typeof formatColors]}`}
                variant="outline"
              >
                {React.createElement(formatIcons[format as keyof typeof formatIcons], { className: "h-4 w-4" })}
                <span>All {format.toUpperCase()}</span>
              </Button>
            ))}

            <Button
              onClick={() => onDownloadAll('zip')}
              className="bg-gray-600 hover:bg-gray-700 text-white flex items-center space-x-1"
            >
              <Package2 className="h-4 w-4" />
              <span>Download ZIP</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Individual Labels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {successfulLabels.map((label, index) => (
          <Card key={label.id} className="p-4 border hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    Label #{index + 1}
                  </div>
                  <div className="text-xs text-gray-500">
                    {label.tracking_code}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {label.carrier}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs">
                <div className="font-medium">{label.customer_name}</div>
                <div className="text-gray-600 line-clamp-2">{label.customer_address}</div>
                <div className="text-gray-600">{label.service} • ${label.rate.toFixed(2)}</div>
              </div>

              {/* Download Options */}
              <div className="flex flex-wrap gap-1">
                {(['png', 'pdf', 'zpl'] as const).map(format => {
                  const url = label.label_urls[format];
                  const IconComponent = formatIcons[format];
                  
                  return (
                    <Button
                      key={format}
                      size="sm"
                      variant="outline"
                      disabled={!url}
                      onClick={() => handleDownloadSingle(label, format)}
                      className={`text-xs ${url ? formatColors[format] : 'opacity-50'}`}
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {format.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Failed Labels */}
      {failedLabels.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <h4 className="font-medium text-red-800 mb-3">
            Failed Labels ({failedLabels.length})
          </h4>
          <div className="space-y-2">
            {failedLabels.map((label, index) => (
              <div key={`failed-${index}`} className="p-3 bg-white rounded border-l-4 border-red-400">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{label.customer_name || `Shipment ${index + 1}`}</div>
                    <div className="text-xs text-gray-600">{label.customer_address}</div>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>
                {label.error && (
                  <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                    {label.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LabelBatchDisplay;
