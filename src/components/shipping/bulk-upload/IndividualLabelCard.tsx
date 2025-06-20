
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Mail, Copy, Package, MapPin, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

interface IndividualLabelCardProps {
  shipment: {
    id: string;
    customer_name?: string;
    customer_address?: string;
    tracking_code?: string;
    carrier?: string;
    service?: string;
    rate?: number;
    label_url?: string;
    label_urls?: {
      pdf?: string;
      png?: string;
      zpl?: string;
      epl?: string;
    };
    status: string;
  };
  onDownload: (format: string) => void;
  onPrintPreview: () => void;
  onEmail: (email: string, format: string) => void;
  onCopyLink: (format: string) => void;
}

const IndividualLabelCard: React.FC<IndividualLabelCardProps> = ({
  shipment,
  onDownload,
  onPrintPreview,
  onEmail,
  onCopyLink
}) => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailFormat, setEmailFormat] = useState('pdf');

  const handleEmailSubmit = () => {
    if (!emailAddress.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    onEmail(emailAddress, emailFormat);
    setEmailDialogOpen(false);
    setEmailAddress('');
    toast.success(`Label sent to ${emailAddress}`);
  };

  const handleCopyLink = (format: string) => {
    onCopyLink(format);
    toast.success(`${format.toUpperCase()} link copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Processing</Badge>;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-blue-600 mr-3" />
          <div>
            <h4 className="font-medium text-gray-900">
              {shipment.customer_name || 'Unknown Recipient'}
            </h4>
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {shipment.customer_address || 'No address'}
            </p>
          </div>
        </div>
        
        {getStatusBadge(shipment.status)}
      </div>

      {/* Shipment Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Tracking:</p>
          <p className="font-mono text-gray-900">{shipment.tracking_code || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Carrier:</p>
          <p className="font-medium flex items-center">
            <Truck className="h-3 w-3 mr-1" />
            {shipment.carrier || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Service:</p>
          <p className="font-medium">{shipment.service || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Rate:</p>
          <p className="font-medium">${shipment.rate?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Actions</h5>
        
        {/* Download Format Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            onClick={() => onDownload('pdf')}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!shipment.label_urls?.pdf}
          >
            <Download className="h-3 w-3 mr-1" />
            PDF
          </Button>
          
          <Button
            onClick={() => onDownload('png')}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!shipment.label_urls?.png}
          >
            <Download className="h-3 w-3 mr-1" />
            PNG
          </Button>
          
          <Button
            onClick={() => onDownload('zpl')}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!shipment.label_urls?.zpl}
          >
            <Download className="h-3 w-3 mr-1" />
            ZPL
          </Button>
          
          <Button
            onClick={() => onDownload('epl')}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
            disabled={!shipment.label_urls?.epl}
          >
            <Download className="h-3 w-3 mr-1" />
            EPL
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onPrintPreview}
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            disabled={!shipment.label_urls?.pdf}
          >
            <Printer className="h-3 w-3 mr-1" />
            Print Preview
          </Button>

          {/* Email Dialog */}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Label via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select value={emailFormat} onValueChange={setEmailFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="zpl">ZPL</SelectItem>
                      <SelectItem value="epl">EPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEmailSubmit} className="flex-1">
                    Send Label
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEmailDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Copy Link Dropdown */}
          <div className="relative">
            <Button
              onClick={() => handleCopyLink('pdf')}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default IndividualLabelCard;
