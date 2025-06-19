
import React, { useState } from 'react';
import TrackingHeader from './TrackingHeader';
import TrackingStats from './TrackingStats';
import TrackingList from './TrackingList';
import TrackingFilters from './TrackingFilters';
import { useTrackingData } from '@/hooks/useTrackingData';

const TrackingDashboard = () => {
  const { trackingData, isLoading, refreshTrackingData } = useTrackingData();
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredData, setFilteredData] = useState(trackingData);

  React.useEffect(() => {
    setFilteredData(trackingData);
  }, [trackingData]);

  const handleTrackingFound = (newTracking: any) => {
    // Refresh the tracking data to include the new tracking
    refreshTrackingData();
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setFilteredData(trackingData);
    } else {
      const filtered = trackingData.filter(item => item.status === filter);
      setFilteredData(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <TrackingHeader 
        onTrackingFound={handleTrackingFound}
        onRefresh={refreshTrackingData}
      />
      
      <TrackingStats trackingData={filteredData} />
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Shipments</h3>
          <TrackingFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            trackingData={trackingData}
          />
        </div>
        
        <div className="p-6">
          <TrackingList
            trackingData={filteredData}
            isLoading={isLoading}
            selectedTracking={selectedTracking}
            setSelectedTracking={setSelectedTracking}
            setActiveFilter={setActiveFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard;
