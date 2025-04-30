
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ChartBar, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShippingData {
  month: string;
  spend: number;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ShippingHistorySummary: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [spendData, setSpendData] = useState<ShippingData[]>([]);
  const [carrierData, setCarrierData] = useState<{name: string, value: number}[]>([]);
  
  const fetchShippingData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-history', {
        body: {}
      });
      
      if (error) throw new Error(error.message);
      
      // Process data for charts
      setSpendData(data.monthlyData || []);
      setCarrierData(data.carrierBreakdown || []);
      
      toast.success('Shipping history updated');
    } catch (error) {
      console.error('Error fetching shipping history:', error);
      toast.error('Failed to load shipping history');
      
      // Set demo data if API fails
      setSpendData([
        { month: 'Jan', spend: 320, count: 12 },
        { month: 'Feb', spend: 450, count: 19 },
        { month: 'Mar', spend: 280, count: 10 },
        { month: 'Apr', spend: 390, count: 15 },
        { month: 'May', spend: 480, count: 22 },
        { month: 'Jun', spend: 520, count: 24 },
      ]);
      
      setCarrierData([
        { name: 'USPS', value: 45 },
        { name: 'UPS', value: 28 },
        { name: 'FedEx', value: 18 },
        { name: 'DHL', value: 9 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchShippingData();
  }, []);

  const handleExportCSV = () => {
    const csvContent = [
      'Month,SpendUSD,ShipmentCount',
      ...spendData.map(item => `${item.month},${item.spend},${item.count}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'shipping_history.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Shipping history exported');
  };

  return (
    <Card className="border-2 border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <ChartBar className="mr-2" /> Shipping History
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchShippingData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Monthly Shipping Spend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={spendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend ($)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="Shipment Count" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Carrier Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carrierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {carrierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Shipment Count by Month</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={spendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Shipment Count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ShippingHistorySummary;
