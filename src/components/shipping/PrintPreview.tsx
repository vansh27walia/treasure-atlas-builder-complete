import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X, FileText, Link as LinkIcon, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
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
  shipmentDetails?: { // Added shipmentDetails prop
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
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
  shipmentDetails, // Destructure shipmentDetails
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
           // Infer type from initialLabelUrl if other specific URLs are not available
           const extension = initialLabelUrl.split('.').pop()?.toLowerCase();
           if (extension === 'pdf') defaultType = 'pdf';
           else if (extension === 'png') defaultType = 'png';
           else if (extension === 'zpl') defaultType = 'zpl';
           else if (extension === 'epl') defaultType = 'epl';
        }
      }
      
      setCurrentLabelUrl(defaultUrl || null);
      setCurrentLabelType(defaultType);
      setTimeout(() => setIsLoading(false), 300);
    } else {
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
      setTimeout(() => setIsLoading(false), 300); 
      toast.info(`Previewing ${format.toUpperCase()} format.`);
    } else {
      toast.error(`${format.toUpperCase()} format not available for this label.`);
      setCurrentLabelUrl(null);
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
      return <div ref={printRef}><img src={currentLabelUrl} alt="Shipping Label" className="max-w-full max-h-[calc(100vh-280px)] mx-auto object-contain" onLoad={() => setIsLoading(false)} onError={() => {setIsLoading(false); toast.error("Failed to load image preview.");}}/></div>;
    }
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
  
  // Adjust labelSource to handle different types
  let resolvedLabelSource: BulkShipment['label_urls'] | ConsolidatedLabelUrls | undefined;
  if (isBatchPreview) {
    resolvedLabelSource = batchResult?.consolidatedLabelUrls;
  } else {
    resolvedLabelSource = labelUrls;
  }

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
                {resolvedLabelSource?.pdf && <Button onClick={() => selectLabelFormat('pdf', getFormatUrl('pdf', resolvedLabelSource))} variant={currentLabelType === 'pdf' ? "default" : "outline"} size="sm">PDF</Button>}
                {/* Conditional rendering for PNG based on type of resolvedLabelSource */}
                {!isBatchPreview && (resolvedLabelSource as BulkShipment['label_urls'])?.png && <Button onClick={() => selectLabelFormat('png', getFormatUrl('png', resolvedLabelSource))} variant={currentLabelType === 'png' ? "default" : "outline"} size="sm">PNG</Button>}
                {resolvedLabelSource?.zpl && <Button onClick={() => selectLabelFormat('zpl', getFormatUrl('zpl', resolvedLabelSource))} variant={currentLabelType === 'zpl' ? "default" : "outline"} size="sm">ZPL</Button>}
                {resolvedLabelSource?.epl && <Button onClick={() => selectLabelFormat('epl', getFormatUrl('epl', resolvedLabelSource))} variant={currentLabelType === 'epl' ? "default" : "outline"} size="sm">EPL</Button>}
                
                {isBatchPreview && (resolvedLabelSource as ConsolidatedLabelUrls)?.pdfZip && <Button onClick={() => handleDownload((resolvedLabelSource as ConsolidatedLabelUrls).pdfZip, 'zip')} variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> PDFs (.zip)</Button>}
                {isBatchPreview && (resolvedLabelSource as ConsolidatedLabelUrls)?.zplZip && <Button onClick={() => handleDownload((resolvedLabelSource as ConsolidatedLabelUrls).zplZip, 'zip')} variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> ZPLs (.zip)</Button>}
                {isBatchPreview && (resolvedLabelSource as ConsolidatedLabelUrls)?.eplZip && <Button onClick={() => handleDownload((resolvedLabelSource as ConsolidatedLabelUrls).eplZip, 'zip')} variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> EPLs (.zip)</Button>}

                {(!resolvedLabelSource?.pdf && !((!isBatchPreview && (resolvedLabelSource as BulkShipment['label_urls'])?.png)) && !resolvedLabelSource?.zpl && !resolvedLabelSource?.epl) && <span className="text-xs text-gray-500">No specific formats available for preview.</span>}
            </div>
             {scanFormUrl && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between"> <div className="flex items-center"> <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> <span className="text-xs font-medium text-green-700">Scan Form / Manifest Ready</span> </div> <Button onClick={() => window.open(scanFormUrl, '_blank')} variant="outline" size="sm"> <LinkIcon className="mr-1 h-3 w-3" /> View Scan Form </Button> </div>
              </div>
            )}
             {!scanFormUrl && isBatchPreview && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md"> <div className="flex items-center"> <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" /> <span className="text-xs font-medium text-yellow-700">Scan Form not available for this batch.</span> </div> </div>
            )}
          </div>

          <div className="flex-grow overflow-auto p-4 bg-gray-50">
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
              {(currentLabelType === 'pdf' || currentLabelType === 'png') && (
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
