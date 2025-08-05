import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartBar, Upload, CreditCard, Package } from 'lucide-react';
import ShippingHistorySummary from '@/components/shipping/ShippingHistorySummary';
const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tracking');

  // Parse tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['tracking', 'bulk', 'history'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/dashboard?tab=${value}`, {
      replace: true
    });
  };
  return <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shipping Dashboard</h1>
        
        
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
    </div>;
};
export default Dashboard;