
import React from 'react';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

const TrackingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Package Tracking
          </h1>
          <p className="text-gray-600">
            Track all your shipments in one place. Search for new packages or view your existing shipments below.
          </p>
        </div>
        
        <TrackingDashboard />
      </div>
    </div>
  );
};

export default TrackingPage;
