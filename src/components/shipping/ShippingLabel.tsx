
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Download, Printer, RefreshCcw, ArrowRight, Link, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId: string | null;
  onRefresh?: () => void;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  onRefresh
}) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(labelUrl);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to store the object URL to clean up properly
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  // Update cached URL when props change
  useEffect(() => {
    if (labelUrl && labelUrl !== cachedUrl) {
      setCachedUrl(labelUrl);
    }
  }, [labelUrl]);

  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Function to retrieve the label
  const fetchLabel = async () => {
    if (!shipmentId || !labelUrl) return;
    
    setIsLoading(true);
    
    try {
      // First try to get the stored label from Supabase
      const { data: labelData, error: labelError } = await supabase.functions.invoke('get-stored-label', {
        body: { shipmentId }
      });
      
      if (labelError || !labelData?.labelUrl) {
        throw new Error('Failed to retrieve stored label');
      }
      
      setCachedUrl(labelData.labelUrl);
      toast({ title: "Label refreshed successfully" });
    } catch (error) {
      console.error('Error fetching label:', error);
      toast({
        title: "Failed to refresh label", 
        description: "Using previously generated label instead"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cachedUrl) return;
    
    try {
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = cachedUrl;
      a.download = `shipping-label-${trackingCode || shipmentId || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({ title: "Label download started" });
    } catch (error) {
      console.error('Error downloading label:', error);
      toast({ 
        title: "Download failed", 
        description: "Please try again or contact support" 
      });
    }
  };

  const handlePrint = async () => {
    if (!cachedUrl) return;
    
    try {
      // Open the label in a new window and print it
      const printWindow = window.open(cachedUrl, '_blank');
      if (printWindow) {
        setTimeout(() => {
          printWindow.print();
        }, 1000); // Short delay to ensure PDF is loaded
      } else {
        toast({
          title: "Popup blocked",
          description: "Please allow popups to print the label"
        });
      }
    } catch (error) {
      console.error('Error printing label:', error);
      toast({ 
        title: "Print failed", 
        description: "Please try again or download the label first" 
      });
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchLabel();
    }
  };
  
  const handleEmailLabel = () => {
    toast({
      title: "Email feature coming soon", 
      description: "Please download the label for now."
    });
  };

  // If no label, show nothing
  if (!labelUrl && !cachedUrl) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-green-800 flex items-center">
          <Download className="mr-2 h-5 w-5 text-green-600" />
          Shipping Label Ready
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-md border-2 border-green-200">
            {cachedUrl && (
              <div className="mb-4">
                <AspectRatio ratio={1/1.4} className="bg-white">
                  <iframe
                    src={cachedUrl}
                    className="h-full w-full rounded"
                    title="Shipping Label"
                  />
                </AspectRatio>
              </div>
            )}
            
            {trackingCode && (
              <div className="mb-4 p-3 bg-green-50 rounded-md">
                <p className="font-semibold text-green-800">Tracking Code:</p>
                <p className="font-mono text-green-700">{trackingCode}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleDownload}
                variant="outline" 
                className="flex-1 sm:flex-none border-green-300 hover:bg-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              
              <Button 
                onClick={handlePrint} 
                variant="outline"
                className="flex-1 sm:flex-none border-green-300 hover:bg-green-50"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                className="flex-1 sm:flex-none border-green-300 hover:bg-green-50"
                disabled={isLoading}
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={handleEmailLabel}
                variant="outline"
                className="flex-1 sm:flex-none border-green-300 hover:bg-green-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button 
              asChild 
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Link href="/dashboard">
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingLabel;
