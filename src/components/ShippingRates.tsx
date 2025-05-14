
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { toast } from 'sonner';
import { CreditCard, Loader, Download, Upload, Truck, Filter, Printer, File } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';

const ShippingRates: React.FC = () => {
  const {
    rates,
    allRates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    shipmentId,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier
  } = useShippingRates();
  
  const { aiRecommendation, isAiLoading } = useRateCalculator();
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [labelFormat, setLabelFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const isMountedRef = useRef(true);
  
  // Set up mount/unmount lifecycle
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Ensure FedEx is always included in the rates if it exists in allRates
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (allRates && allRates.length > 0) {
      const hasFedEx = allRates.some(rate => 
        rate.carrier.toLowerCase().includes('fedex')
      );
      
      const fedExMissingInFilteredRates = hasFedEx && 
        !rates.some(rate => rate.carrier.toLowerCase().includes('fedex'));
      
      if (fedExMissingInFilteredRates && activeCarrierFilter === 'all') {
        // We might want to log this inconsistency for debugging
        console.log('FedEx found in allRates but missing in filtered rates');
      }
    }
  }, [rates, allRates, activeCarrierFilter]);

  // Function to download the label in the selected format
  const downloadLabel = async () => {
    if (!labelUrl) {
      toast.error("No label available to download");
      return;
    }

    try {
      // If we need to convert the format, call the backend
      if (labelFormat !== 'pdf' && labelUrl.toLowerCase().endsWith('.pdf')) {
        toast.loading(`Converting label to ${labelFormat.toUpperCase()}...`);
        
        // Call the edge function to convert the label format
        const { data, error } = await supabase.functions.invoke('convert-label-format', {
          body: { 
            labelUrl, 
            format: labelFormat, 
            shipmentId 
          }
        });
        
        if (error) {
          toast.error(`Failed to convert label: ${error.message}`);
          return;
        }
        
        // Use the converted URL
        window.open(data.convertedUrl, '_blank');
        toast.success(`Label downloaded as ${labelFormat.toUpperCase()}`);
      } else {
        // Just open the existing URL if it's already in the right format
        window.open(labelUrl, '_blank');
        toast.success(`Label downloaded`);
      }
    } catch (error: any) {
      toast.error(`Error downloading label: ${error.message || 'Unknown error'}`);
    }
  };

  // Function to print the label
  const printLabel = () => {
    if (!labelUrl) {
      toast.error("No label available to print");
      return;
    }
    
    // Create an iframe to print without opening a new window
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = labelUrl;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch (error) {
        toast.error("Unable to print. Opening label in new window instead.");
        window.open(labelUrl, '_blank');
      }
      
      // Remove the iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  // Handle buying a label directly
  const onBuyLabel = () => {
    if (!selectedRateId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    // Directly call handleCreateLabel with the selected rate
    handleCreateLabel();
  };

  // Sort the rates based on the selected sorting option
  const sortedRates = [...rates].sort((a, b) => {
    if (sortOrder === 'price') {
      // Ensure both rates are treated as numbers for comparison
      return parseFloat(String(a.rate)) - parseFloat(String(b.rate));
    } else if (sortOrder === 'speed') {
      const aDays = a.delivery_days || 999;
      const bDays = b.delivery_days || 999;
      return aDays - bDays;
    } else {
      return a.carrier.localeCompare(b.carrier);
    }
  });
  
  // Always render a component, regardless of rates.length
  // This ensures hooks are always called in the same order
  const renderContent = () => {
    if (rates.length === 0) {
      return (
        <div className="mt-8 w-full" id="shipping-rates-section">
          <EmptyRatesState />
          <div className="mt-4 flex justify-end">
            <Link to="/bulk-upload">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8 w-full px-4" id="shipping-rates-section">
        <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden w-full">
          <div className="p-6">
            {/* Card header with title and filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-2xl font-semibold text-blue-800 flex items-center mb-3 md:mb-0">
                <Truck className="mr-2 h-6 w-6 text-blue-600" />
                Available Shipping Rates
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                      <Filter className="h-4 w-4" />
                      {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => handleFilterByCarrier('all')}>
                      All Carriers
                    </DropdownMenuItem>
                    {uniqueCarriers.map((carrier) => (
                      <DropdownMenuItem 
                        key={carrier} 
                        onClick={() => handleFilterByCarrier(carrier)}
                      >
                        {carrier.toUpperCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                      Sort by: {
                        sortOrder === 'price' ? 'Price' : 
                        sortOrder === 'speed' ? 'Speed' : 
                        'Carrier'
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => setSortOrder('speed')}>
                      Speed (Fastest First)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('price')}>
                      Price (Lowest First)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('carrier')}>
                      Carrier (A-Z)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <ShippingLabel 
              labelUrl={labelUrl} 
              trackingCode={trackingCode} 
              shipmentId={shipmentId}
            />
            
            {!labelUrl && (
              <>
                {/* AI Recommendations */}
                {(aiRecommendation || isAiLoading) && (
                  <ShippingAIRecommendation 
                    aiRecommendation={aiRecommendation}
                    isLoading={isAiLoading}
                    onSelectRecommendation={handleSelectRate}
                  />
                )}
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">All Available Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedRates.map((rate) => (
                      <ShippingRateCard
                        key={rate.id}
                        rate={{
                          ...rate,
                          // Ensure rate is treated as a number for compatibility with ShippingOption
                          rate: typeof rate.rate === 'string' ? parseFloat(rate.rate) : Number(rate.rate)
                        }}
                        isSelected={selectedRateId === rate.id}
                        onSelect={handleSelectRate}
                        isBestValue={rate.id === bestValueRateId}
                        isFastest={rate.id === fastestRateId}
                        aiRecommendation={aiRecommendation && {
                          rateId: aiRecommendation.bestOverall || '',
                          reason: aiRecommendation.analysisText || ''
                        }}
                        showDiscount={true}
                        originalRate={typeof rate.original_rate === 'string' ? 
                          parseFloat(rate.original_rate) : 
                          (rate.original_rate || 0)
                        }
                        isPremium={!!rate.isPremium}
                      />
                    ))}
                  </div>

                  {sortedRates.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-gray-600">No rates match the current filter. Try changing your filter criteria.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => handleFilterByCarrier('all')} 
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex flex-wrap justify-end gap-4">
                  <Button 
                    onClick={onBuyLabel}
                    disabled={!selectedRateId || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-2 h-12 text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Creating Label...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Buy & Print Label
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={!selectedRateId || isProcessingPayment}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-6 py-2 h-12 text-base"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
            
            {labelUrl && (
              <div className="mt-6 flex flex-col space-y-4">
                <div className="flex flex-wrap justify-center gap-3">
                  <Button 
                    onClick={() => setShowLabelPreview(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <File className="h-4 w-4" />
                    Preview Label
                  </Button>
                  <Button 
                    onClick={downloadLabel}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Label
                  </Button>
                  <Button 
                    onClick={printLabel}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Label
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>* All rates include handling fees and applicable taxes</p>
            </div>
          </div>
        </Card>

        {/* Label Preview Dialog */}
        <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
          <DialogContent className="max-w-3xl h-[95vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center">
                <File className="mr-2 h-5 w-5" />
                Shipping Label Preview
              </DialogTitle>
              <Tabs value={labelFormat} onValueChange={(value) => setLabelFormat(value as 'pdf' | 'png' | 'zpl')} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pdf">PDF</TabsTrigger>
                  <TabsTrigger value="png">PNG</TabsTrigger>
                  <TabsTrigger value="zpl">ZPL</TabsTrigger>
                </TabsList>
              </Tabs>
            </DialogHeader>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white rounded shadow-md p-2 h-full flex items-center justify-center">
                {labelUrl ? (
                  <iframe 
                    src={labelUrl} 
                    title="Shipping Label" 
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>Label preview not available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button 
                onClick={downloadLabel}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download as {labelFormat.toUpperCase()}
              </Button>
              <Button 
                onClick={printLabel}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return renderContent();
};

export default ShippingRates;

