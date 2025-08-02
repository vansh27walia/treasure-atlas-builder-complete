
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Container, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LtlShippingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ltl');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Freight Services</h1>
              <p className="text-gray-600">Less Than Truckload (LTL) and Full Truckload (FTL) shipping solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="ltl" className="flex items-center gap-2">
                <Container className="h-4 w-4" />
                LTL Shipping
              </TabsTrigger>
              <TabsTrigger value="ftl" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                FTL Shipping
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ltl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Container className="h-6 w-6 text-blue-600" />
                      LTL Shipping
                    </CardTitle>
                    <CardDescription>
                      Perfect for shipments that don't require a full truck
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Key Features:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>Cost-effective for smaller shipments (150-15,000 lbs)</li>
                          <li>Shared truck space with other shippers</li>
                          <li>Multiple pickup and delivery stops</li>
                          <li>Freight classification based on density and handling</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>Palletized freight</li>
                          <li>Regular business-to-business shipments</li>
                          <li>Non-urgent deliveries</li>
                          <li>Cost-conscious shippers</li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Transit Time:</strong> 1-5 business days depending on distance and service level
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle>Get LTL Quote</CardTitle>
                    <CardDescription>
                      Request a quote for your LTL shipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Our LTL quoting system will help you find the best rates from our network of trusted carriers.
                      </p>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate('/freight-forwarding')}
                      >
                        Get LTL Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="ftl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-6 w-6 text-green-600" />
                      FTL Shipping
                    </CardTitle>
                    <CardDescription>
                      Dedicated truck for your shipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Key Features:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>Exclusive use of entire truck</li>
                          <li>Direct pickup to delivery</li>
                          <li>Faster transit times</li>
                          <li>Better for fragile or high-value items</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Best For:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>Large shipments (15,000+ lbs or 10+ pallets)</li>
                          <li>Time-sensitive deliveries</li>
                          <li>Fragile or high-value freight</li>
                          <li>Temperature-controlled shipments</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                          <strong>Transit Time:</strong> 1-3 business days with direct delivery
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle>Get FTL Quote</CardTitle>
                    <CardDescription>
                      Request a quote for your FTL shipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Get competitive rates for full truckload shipments with our carrier network.
                      </p>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => navigate('/freight-forwarding')}
                      >
                        Get FTL Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LtlShippingPage;
