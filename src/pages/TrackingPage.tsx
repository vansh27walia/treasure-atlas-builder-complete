
import React from 'react';
import EnhancedTrackingPage from '@/components/tracking/EnhancedTrackingPage';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

const TrackingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedTrackingPage />
      <div className="container mx-auto px-4 pb-8">
        <TrackingDashboard />
      </div>
    </div>
  );
};

export default TrackingPage;
