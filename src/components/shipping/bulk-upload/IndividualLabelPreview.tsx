
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface IndividualLabelPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string;
  trackingCode: string | null;
}

const IndividualLabelPreview: React.FC<IndividualLabelPreviewProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingCode
}) => {
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && labelUrl) {
      downloadToLocal();
    }
    
    return () => {
      // Cleanup blob URL when component unmounts
      if (localPdfUrl) {
        URL.revokeObjectURL(localPdfUrl);
      }
    };
  }, [isOpen, labelUrl]);

  const downloadToLocal = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(labelUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch label');
      }
      
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      setLocalPdfUrl(localUrl);
    } catch (err) {
      setError('Failed to load label preview');
      console.error('Error downloading label:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!localPdfUrl) return;
    
    const link = document.createElement('a');
    link.href = localPdfUrl;
    link.download = `label_${trackingCode || 'unknown'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Label downloaded successfully');
  };

  const handlePrint = () => {
    if (!localPdfUrl) return;
    
    const printWindow = window.open(localPdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Label Preview {trackingCode && `- ${trackingCode}`}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading label preview...</p>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center p-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={downloadToLocal} variant="outline">
                Retry
              </Button>
            </div>
          )}
          
          {/* PDF Preview */}
          {localPdfUrl && !isLoading && !error && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={localPdfUrl}
                  className="w-full h-96"
                  title="Label Preview"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndividualLabelPreview;
