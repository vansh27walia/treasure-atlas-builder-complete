
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AddressEmptyStateProps {
  onAddClick: () => void;
}

const AddressEmptyState: React.FC<AddressEmptyStateProps> = ({ onAddClick }) => {
  return (
    <div className="text-sm text-gray-500 flex items-center justify-between bg-gray-50 border rounded-md p-3">
      <span>No saved addresses</span>
      <Button size="sm" variant="default" onClick={onAddClick}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Address
      </Button>
    </div>
  );
};

export default AddressEmptyState;
