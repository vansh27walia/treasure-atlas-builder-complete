
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const CreateLabelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [labelCreated, setLabelCreated] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string>('');
  const [shipmentData, setShipmentData] = useState<any>(null);

  useEffect(() => {
    // Get shipment data from navigation state
    if (location.state?.shipmentData) {
      setShipmentData(location.state.shipmentData);
    } else {
      toast.error('No shipment data found');
      navigate('/');
    }
  }, [location, navigate]);

  const handleCreateLabel = async () => {
    if (!shipmentData) {
      toast.error('No shipment data available');
      return;
    }

    setIsCreating(true);

    try {
      console.log('Creating label for shipment:', shipmentData);
      
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: {
          shipment: shipmentData,
          labelOptions: {
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Error creating label:', error);
        throw new Error(error.message || 'Failed to create label');
      }

      if (data && data.success && data.labelUrl) {
        console.log('Label created successfully:', data);
        setLabelUrl(data.labelUrl);
        setLabelCreated(true);
        toast.success('Label created successfully!');
      } else {
        throw new Error('No label URL returned from creation');
      }

    } catch (error) {
      console.error('Failed to create label:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create label');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadLabel = () => {
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    } else {
      toast.error('No label available for download');
    }
  };

  const handlePrintLabel = () => {
    if (labelUrl) {
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      toast.error('No label available for printing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <Package className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-3xl font-bold">Create Shipping Label</h1>
            </div>
            <p className="text-gray-600">Generate your shipping label</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Label Creation</CardTitle>
            </CardHeader>
            <CardContent>
              {!labelCreated && !isCreating && shipmentData && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Shipment Summary</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• From: {shipmentData.from?.name || 'Sender'}</p>
                      <p>• To: {shipmentData.to?.name || 'Recipient'}</p>
                      <p>• Service: {shipmentData.service || 'Standard Shipping'}</p>
                      {shipmentData.rate && (
                        <p>• Rate: ${shipmentData.rate}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateLabel}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Create Label
                  </Button>
                </div>
              )}

              {isCreating && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Creating Label...</h3>
                  <p className="text-gray-600">Please wait while we generate your shipping label.</p>
                </div>
              )}

              {labelCreated && (
                <div className="space-y-6">
                  <div className="flex items-center text-green-600 mb-4">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    <span className="text-lg font-semibold">Label Created Successfully!</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDownloadLabel}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Download Label
                    </Button>
                    <Button
                      onClick={handlePrintLabel}
                      variant="outline"
                      className="flex-1"
                    >
                      Print Label
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another Label
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateLabelPage;
