
import React from 'react';
import { toast } from '@/components/ui/sonner';
import type { SavedAddress } from '@/utils/addressUtils';

interface BulkUploadProps {
  setPickupAddress?: (address: SavedAddress | null) => void;
}

// Export named component
export const BulkUpload: React.FC<BulkUploadProps> = ({ setPickupAddress }) => {
  // Just updating the handlePickupAddressSelect function to be more robust
  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address) {
      if (setPickupAddress) setPickupAddress(address);
      console.log("Selected pickup address for bulk upload:", address);
      toast.success(`Using "${address.name || 'Unnamed address'}" as pickup location`);
    } else {
      toast.error('Please select a valid pickup address');
    }
  };

  // Rest of component implementation
  return <div>Bulk upload component</div>;
};

// Also export as default for backward compatibility
export default BulkUpload;
