
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
}

interface TrackingHistoryChartProps {
  data: TrackingInfo[];
}

const TrackingHistoryChart: React.FC<TrackingHistoryChartProps> = ({ data }) => {
  // Process data for the chart - group by month and count shipments
  const processChartData = () => {
    const monthlyData: { [key: string]: { name: string, count: number, delivered: number } } = {};
    
    data.forEach(item => {
      const date = new Date(item.last_update);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { 
          name: monthYear,
          count: 0,
          delivered: 0
        };
      }
      
      monthlyData[monthYear].count += 1;
      
      if (item.status === 'delivered') {
        monthlyData[monthYear].delivered += 1;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      // Sort by month and year
      const [aMonth, aYear] = a.name.split('-');
      const [bMonth, bYear] = b.name.split('-');
      
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
  };

  const chartData = processChartData();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No shipping history available to display
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Total Shipments" fill="#8884d8" />
          <Bar dataKey="delivered" name="Delivered" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrackingHistoryChart;
