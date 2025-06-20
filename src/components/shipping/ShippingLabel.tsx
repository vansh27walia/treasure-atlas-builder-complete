
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, File, FileArchive, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LabelActions from './LabelActions';
import EnhancedLabelCreationView from './EnhancedLabelCreationView';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  carrier?: string;
  service?: string;
  rate?: number;
  onFormatChange?: (format: string) => void;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  customerName,
  customerEmail,
  customerAddress,
  carrier,
  service,
  rate,
  onFormatChange
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  
  // Update local URL when prop changes
  useEffect(() => {
    if (labelUrl !== localLabelUrl) {
      setLocalLabelUrl(labelUrl);
    }
  }, [labelUrl]);
  
  // Handle format changes
  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    
    if (onFormatChange) {
      try {
        setIsRefreshing(true);
        await onFormatChange(format);
        setIsRefreshing(false);
        toast.success(`Label format changed to ${format}`);
      } catch (error) {
        console.error("Error changing label format:", error);
        toast.error("Failed to change label format");
        setIsRefreshing(false);
      }
    }
  };

  // Auto-save label to backend
  useEffect(() => {
    const saveLabelToBackend = async () => {
      if (!labelUrl || !trackingCode || !shipmentId) return;
      
      try {
        const { error } = await supabase
          .from('shipment_records')
          .upsert({
            shipment_id: shipmentId,
            tracking_code: trackingCode,
            label_url: labelUrl,
            status: 'completed',
            label_format: selectedFormat,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error saving label to backend:', error);
        } else {
          console.log('Label automatically saved to backend');
        }
      } catch (error) {
        console.error('Error saving label:', error);
      }
    };

    saveLabelToBackend();
  }, [labelUrl, trackingCode, shipmentId, selectedFormat]);
  
  if (!labelUrl && !localLabelUrl) {
    console.log("No label URL available in ShippingLabel component");
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
        <p className="text-yellow-700">No label URL available. Please try generating the label again.</p>
      </div>
    );
  }

  // Transform single label data for EnhancedLabelCreationView
  const labelData = [{
    id: shipmentId || '',
    tracking_code: trackingCode || '',
    carrier: carrier || 'Unknown',
    service: service || 'Standard',
    label_url: localLabelUrl || labelUrl || '',
    customer_name: customerName || 'Unknown Customer',
    customer_address: customerAddress || 'Unknown Address',
    customer_email: customerEmail,
    rate: rate || 0,
    status: 'success' as const
  }];
  
  return (
    <div className="mb-8">
      <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-purple-800 text-xl mb-2">Label Generated Successfully!</h3>
              <p className="text-sm text-purple-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span></p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRefreshing}
              >
                <SelectTrigger className="w-[200px] bg-white text-purple-800 border-purple-200">
                  <SelectValue placeholder="Select Label Format" />
                </SelectTrigger>
                <SelectContent>
                  {labelFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {shipmentId && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                  Refresh
                </Button>
              )}
            </div>
          </div>
          
          {isRefreshing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-purple-800">Regenerating label with new format...</p>
            </div>
          ) : (
            <div className="text-sm text-center text-purple-600">
              <p>Your label is ready! Use the actions below to download, print, or email your label.</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Label Creation View */}
      <EnhancedLabelCreationView
        labels={labelData}
        onDownloadLabel={() => console.log('Label downloaded')}
      />
    </div>
  );
};

export default ShippingLabel;
