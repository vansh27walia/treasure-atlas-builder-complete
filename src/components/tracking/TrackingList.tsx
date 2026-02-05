
import React, { useState, useEffect } from 'react';
import TrackingListItem from './TrackingListItem';
import TrackingEmptyState from './TrackingEmptyState';

interface TrackingEvent {
  id: string;
  description: string;
  location: string;
  timestamp: string;
  status: string;
}

interface PackageDetails {
  weight: string;
  dimensions: string;
  service: string;
}

interface EstimatedDelivery {
  date: string;
  time_range: string;
}

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  carrier_code: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
  shipment_id: string;
  recipient: string;
  recipient_address: string;
  package_details: PackageDetails;
  estimated_delivery: EstimatedDelivery | null;
  tracking_events?: TrackingEvent[];
}

interface TrackingListProps {
  trackingData: TrackingInfo[];
  isLoading: boolean;
  selectedTracking: string | null;
  setSelectedTracking: (trackingCode: string | null) => void;
  setActiveFilter: (filter: string) => void;
}

const TrackingList: React.FC<TrackingListProps> = ({
  trackingData,
  isLoading,
  selectedTracking,
  setSelectedTracking,
  setActiveFilter
}) => {
  if (trackingData.length === 0) {
    return (
      <TrackingEmptyState 
        isLoading={isLoading} 
        onShowAll={() => setActiveFilter('all')} 
      />
    );
  }
  
  const handleSelectTracking = (trackingCode: string) => {
    setSelectedTracking(trackingCode === selectedTracking ? null : trackingCode);
  };

  return (
    <div className="space-y-4">
      {trackingData.map((item) => (
        <TrackingListItem
          key={item.id}
          item={item}
          isSelected={selectedTracking === item.tracking_code}
          onSelect={handleSelectTracking}
        />
      ))}
    </div>
  );
};

export default TrackingList;
