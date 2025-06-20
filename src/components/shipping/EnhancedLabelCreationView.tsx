
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, User, MapPin } from 'lucide-react';
import LabelActions from './LabelActions';

interface LabelInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  service: string;
  label_url: string;
  customer_name: string;
  customer_address: string;
  customer_email?: string;
  rate: number;
  status: 'success' | 'failed';
}

interface EnhancedLabelCreationViewProps {
  labels: LabelInfo[];
  onDownloadLabel?: (labelId: string) => void;
}

const EnhancedLabelCreationView: React.FC<EnhancedLabelCreationViewProps> = ({
  labels,
  onDownloadLabel
}) => {
  const successfulLabels = labels.filter(label => label.status === 'success');
  const failedLabels = labels.filter(label => label.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="mr-2 h-5 w-5" />
            Label Creation Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{successfulLabels.length}</div>
              <div className="text-sm text-green-700">Labels Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{failedLabels.length}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{labels.length}</div>
              <div className="text-sm text-blue-700">Total Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${successfulLabels.reduce((sum, label) => sum + label.rate, 0).toFixed(2)}
              </div>
              <div className="text-sm text-purple-700">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Labels */}
      {successfulLabels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Individual Labels ({successfulLabels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {successfulLabels.map((label) => (
                <div key={label.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{label.customer_name}</div>
                          <div className="text-sm text-gray-500">{label.customer_email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                        <div className="text-sm text-gray-600">{label.customer_address}</div>
                      </div>
                      
                      <div className="flex flex-col">
                        <Badge variant="outline" className="mb-1 w-fit">
                          {label.tracking_code}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {label.carrier} - {label.service}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          ${label.rate.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <LabelActions
                        labelUrl={label.label_url}
                        trackingCode={label.tracking_code}
                        shipmentId={label.id}
                        customerEmail={label.customer_email}
                        onDownload={() => onDownloadLabel?.(label.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Labels */}
      {failedLabels.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Failed Labels ({failedLabels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedLabels.map((label, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">{label.customer_name}</div>
                  <div className="text-sm text-red-600 mt-1">
                    Error: Failed to create label
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedLabelCreationView;
