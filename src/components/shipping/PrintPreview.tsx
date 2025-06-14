
import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, FileText, Link as LinkIcon, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react'; // Added Loader2, Info
import { useReactToPrint } from 'react-to-print';
import { BatchResult, ConsolidatedLabelUrls, BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

interface PrintPreviewProps {
  isOpenProp: boolean;
  onOpenChangeProp: (isOpen: boolean) => void;
  labelUrl?: string; 
  labelUrls?: BulkShipment['label_urls']; 
  trackingCode?: string | null;
  shipmentId?: string; 
  batchResult?: BatchResult | null; 
  isBatchPreview?: boolean;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  isOpenProp,
  onOpenChangeProp,
  labelUrl: initialLabelUrl,
  labelUrls,
  trackingCode,
  shipmentId,
  batchResult,
  isBatchPreview = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [currentLabelUrl, setCurrentLabelUrl] = useState<string | null>(null);
  const [currentLabelType, setCurrentLabelType] = useState<'pdf' | 'png' | 'zpl' | 'epl' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (isOpenProp) {
      setIsLoading(true);
      setIframeError(false);
      let defaultUrl: string | undefined = undefined;
      let defaultType: 'pdf' | 'png' | 'zpl' | 'epl' | null = null;

      if (isBatchPreview && batchResult?.consolidatedLabelUrls) {
        if (batchResult.consolidatedLabelUrls.pdf) {
          defaultUrl = batchResult.consolidatedLabelUrls.pdf;
          defaultType = 'pdf';
        } else if (batchResult.consolidatedLabelUrls.zpl) {
          defaultUrl = batchResult.consolidatedLabelUrls.zpl;
          defaultType = 'zpl';
        } else if (batchResult.consolidatedLabelUrls.epl) {
          defaultUrl = batchResult.consolidatedLabelUrls.epl;
          defaultType = 'epl';
        }
      } else if (!isBatchPreview) {
        if (labelUrls?.pdf) {
          defaultUrl = labelUrls.pdf;
          defaultType = 'pdf';
        } else if (labelUrls?.png) {
          defaultUrl = labelUrls.png;
          defaultType = 'png';
        } else if (labelUrls?.zpl) {
          defaultUrl = labelUrls.zpl;
          defaultType = 'zpl';
        } else if (labelUrls?.epl) {
          defaultUrl = labelUrls.epl;
          defaultType = 'epl';
        } else if (initialLabelUrl) {
           defaultUrl = initialLabelUrl;
           defaultType = initialLabelUrl.endsWith('.pdf') ? 'pdf' : initialLabelUrl.endsWith('.png') ? 'png' : null;
        }
      }
      
      setCurrentLabelUrl(defaultUrl || null);
      setCurrentLabelType(defaultType);
      // Short delay for UI update, actual content loading is async
      setTimeout(() => setIsLoading(false), 300);
    } else {
      // Reset when closed
      setCurrentLabelUrl(null);
      setCurrentLabelType(null);
      setIsLoading(false);
      setIframeError(false);
    }
  }, [isOpenProp, isBatchPreview, batchResult, initialLabelUrl, labelUrls]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: isBatchPreview ? `Batch-${batchResult?.batchId || 'labels'}` : `Label-${trackingCode || shipmentId || 'details'}`,
    onBeforeGetContent: () => setIsLoading(true),
    onAfterPrint: () => setIsLoading(false),
    onPrintError: () => { setIsLoading(false); toast.error("Printing failed."); }
  });

  const handleDownload = (urlToDownload?: string, typeToDownload?: string) => {
    const finalUrl = urlToDownload || currentLabelUrl;
    const finalType = typeToDownload || currentLabelType;

    if (!finalUrl) {
      toast.error("No label URL available for download.");
      return;
    }
    const link = document.createElement('a');
    link.href = finalUrl;
    const fileExtension = finalType || finalUrl.split('.').pop()?.split('?')[0] || 'unknown';
    const fileNameBase = isBatchPreview ? `batch_${batchResult?.batchId || 'labels'}` : `label_${trackingCode || shipmentId}`;
    link.download = `${fileNameBase}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Label downloaded as ${fileExtension.toUpperCase()}`);
  };
  
  const selectLabelFormat = (format: 'pdf' | 'png' | 'zpl' | 'epl', url?: string) => {
    if (url) {
      setIsLoading(true);
      setIframeError(false);
      setCurrentLabelUrl(url);
      setCurrentLabelType(format);
      // Delay helps browser start loading iframe/img before removing loader
      setTimeout(() => setIsLoading(false), 300); 
      toast.info(`Previewing ${format.toUpperCase()} format.`);
    } else {
      toast.error(`${format.toUpperCase()} format not available for this label.`);
      setCurrentLabelUrl(null); // Clear preview if format not available
      setCurrentLabelType(null);
      setIsLoading(false);
    }
  };

  const renderLabelContent = () => {
    if (isLoading && !iframeError) {
      return <div className="flex flex-col justify-center items-center h-full min-h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /> <span className="ml-2 mt-2">Loading preview...</span></div>;
    }
    if (iframeError && currentLabelType === 'pdf') {
        return (
            <div className="text-center py-10 text-gray-600 bg-yellow-50 p-4 rounded-md min-h-[300px]">
                <AlertTriangle className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
                <p className="font-semibold">Could not load PDF preview.</p>
                <p className="text-sm mb-3">This might be due to browser settings or network issues.</p>
                <Button onClick={() => handleDownload()} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>
        );
    }
    if (!currentLabelUrl) {
      return <div className="text-center py-10 text-gray-500 min-h-[300px]">No label to preview. Select a format or check data.</div>;
    }
    if (currentLabelType === 'pdf') {
      return <iframe 
                src={currentLabelUrl} 
                className="w-full h-[calc(100vh-280px)] min-h-[400px] border-0" 
                title="Label Preview" 
                onLoad={() => { setIsLoading(false); setIframeError(false); }}
                onError={() => { setIsLoading(false); setIframeError(true); }}
             />;
    }
    if (currentLabelType === 'png') {
      // For printing PNG, it must be in the printRef
      return <div ref={printRef}><img src={currentLabelUrl} alt="Shipping Label" className="max-w-full max-h-[calc(100vh-280px)] mx-auto object-contain" onLoad={() => setIsLoading(false)} onError={() => {setIsLoading(false); toast.error("Failed to load image preview.");}}/></div>;
    }
    // For ZPL/EPL
    return (
      <div className="p-4 bg-gray-100 rounded-md h-auto min-h-[300px] max-h-[calc(100vh-280px)] overflow-auto">
        <h3 className="font-semibold text-lg mb-2">Raw {currentLabelType?.toUpperCase()} Label Content</h3>
        <p className="text-sm text-gray-600 mb-4">
          This is a direct link to the {currentLabelType?.toUpperCase()} file. Actual printing requires a compatible {currentLabelType?.toUpperCase()} printer or software.
        </p>
         <Button onClick={() => handleDownload()} variant="outline" size="sm" className="mt-4">
            <Download className="mr-2 h-4 w-4" /> Download {currentLabelType?.toUpperCase()}
          </Button>
          <pre className="mt-4 whitespace-pre-wrap break-all bg-white p-3 rounded text-xs border">
            {`URL: ${currentLabelUrl}`}
        </pre>
      </div>
    );
  };

  const getFormatUrl = (formatKey: keyof ConsolidatedLabelUrls | keyof NonNullable<BulkShipment['label_urls']>, source?: ConsolidatedLabelUrls | BulkShipment['label_urls']) => source?.[formatKey as any];

  const title = isBatchPreview ? `Batch Label Preview (ID: ${batchResult?.batchId || 'N/A'})` : `Label Preview (Tracking: ${trackingCode || shipmentId || 'N/A'})`;
  const scanFormUrl = batchResult?.scanFormUrl;
  const labelSource = isBatchPreview ? batchResult?.consolidatedLabelUrls : labelUrls;

  return (
      <Dialog open={isOpenProp} onOpenChange={onOpenChangeProp}>
        <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              {title}
            </DialogTitle>
            {isBatchPreview && batchResult?.status && (
                 <DialogDescription className="text-xs">Status: <span className="font-medium capitalize">{batchResult.status}</span></DialogDescription>
            )}
          </DialogHeader>
          
          <div className="p-4 flex-shrink-0 border-b">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium mr-2">Formats:</span>
                {labelSource?.pdf && <Button onClick={() => selectLabelFormat('pdf', getFormatUrl('pdf', labelSource))} variant={currentLabelType === 'pdf' ? "default" : "outline"} size="xs">PDF</Button>}
                {labelSource?.png && !isBatchPreview && <Button onClick={() => selectLabelFormat('png', getFormatUrl('png', labelSource))} variant={currentLabelType === 'png' ? "default" : "outline"} size="xs">PNG</Button>}
                {labelSource?.zpl && <Button onClick={() => selectLabelFormat('zpl', getFormatUrl('zpl', labelSource))} variant={currentLabelType === 'zpl' ? "default" : "outline"} size="xs">ZPL</Button>}
                {labelSource?.epl && <Button onClick={() => selectLabelFormat('epl', getFormatUrl('epl', labelSource))} variant={currentLabelType === 'epl' ? "default" : "outline"} size="xs">EPL</Button>}
                {isBatchPreview && batchResult?.consolidatedLabelUrls?.pdfZip && <Button onClick={() => handleDownload(batchResult.consolidatedLabelUrls.pdfZip, 'zip')} variant="outline" size="xs"><Download className="mr-1 h-3 w-3" /> PDFs (.zip)</Button>}
                {isBatchPreview && batchResult?.consolidatedLabelUrls?.zplZip && <Button onClick={() => handleDownload(batchResult.consolidatedLabelUrls.zplZip, 'zip')} variant="outline" size="xs"><Download className="mr-1 h-3 w-3" /> ZPLs (.zip)</Button>}
                {isBatchPreview && batchResult?.consolidatedLabelUrls?.eplZip && <Button onClick={() => handleDownload(batchResult.consolidatedLabelUrls.eplZip, 'zip')} variant="outline" size="xs"><Download className="mr-1 h-3 w-3" /> EPLs (.zip)</Button>}
                {(!labelSource?.pdf && !labelSource?.png && !labelSource?.zpl && !labelSource?.epl) && <span className="text-xs text-gray-500">No specific formats available for preview.</span>}
            </div>
             {scanFormUrl && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between"> <div className="flex items-center"> <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> <span className="text-xs font-medium text-green-700">Scan Form / Manifest Ready</span> </div> <Button onClick={() => window.open(scanFormUrl, '_blank')} variant="outline" size="xs"> <LinkIcon className="mr-1 h-3 w-3" /> View Scan Form </Button> </div>
              </div>
            )}
             {!scanFormUrl && isBatchPreview && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md"> <div className="flex items-center"> <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" /> <span className="text-xs font-medium text-yellow-700">Scan Form not available for this batch.</span> </div> </div>
            )}
          </div>

          <div className="flex-grow overflow-auto p-4 bg-gray-50">
            {/* For PDF, the iframe itself is the print target. For PNG, printRef is on the img parent. */}
            {currentLabelType === 'pdf' ? renderLabelContent() : <div ref={printRef}>{renderLabelContent()}</div>}
          </div>

          <DialogFooter className="p-4 border-t flex-shrink-0 sm:justify-between items-center">
            <DialogClose asChild>
              <Button variant="ghost" size="sm"><X className="mr-1 h-4 w-4" />Close</Button>
            </DialogClose>
            <div className="flex space-x-2">
              <Button onClick={() => handleDownload()} variant="outline" size="sm" disabled={!currentLabelUrl || isLoading}>
                <Download className="mr-1 h-4 w-4" />Download Current
              </Button>
              {(currentLabelType === 'pdf' || currentLabelType === 'png') && ( // Only allow printing for visual formats
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700" size="sm" disabled={isLoading || !currentLabelUrl || iframeError}>
                  <Printer className="mr-1 h-4 w-4" />Print
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};

export default PrintPreview;

