
import React from 'react';
import Header from '@/components/Header';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartBar, Upload, CreditCard, Package } from 'lucide-react';
import ShippingHistorySummary from '@/components/shipping/ShippingHistorySummary';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shipping Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-blue-50 border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-700">Total Shipments</p>
                <h3 className="text-2xl font-bold text-blue-900">142</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">+12% from last month</p>
          </Card>
          
          <Card className="p-6 bg-green-50 border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700">Delivered</p>
                <h3 className="text-2xl font-bold text-green-900">128</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">98% success rate</p>
          </Card>
          
          <Card className="p-6 bg-purple-50 border border-purple-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-700">In Transit</p>
                <h3 className="text-2xl font-bold text-purple-900">14</h3>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">All on schedule</p>
          </Card>
          
          <Card className="p-6 bg-amber-50 border border-amber-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-amber-700">Shipping Spend</p>
                <h3 className="text-2xl font-bold text-amber-900">$1,256</h3>
              </div>
              <div className="bg-amber-100 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">Saved $320 this month</p>
          </Card>
        </div>
        
        <Tabs defaultValue="tracking" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tracking" className="flex items-center">
              <Package className="mr-2 h-4 w-4" /> Tracking
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" /> Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <ChartBar className="mr-2 h-4 w-4" /> Shipping History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracking">
            <TrackingDashboard />
          </TabsContent>
          
          <TabsContent value="bulk">
            <BulkUpload />
          </TabsContent>
          
          <TabsContent value="history">
            <ShippingHistorySummary />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
