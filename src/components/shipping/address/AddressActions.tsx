
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AddressActionsProps {
  onRefresh: () => void;
}

const AddressActions: React.FC<AddressActionsProps> = ({ onRefresh }) => {
  return (
    <div className="flex justify-end">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 px-2 text-xs" 
        onClick={onRefresh}
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Refresh Addresses
      </Button>
    </div>
  );
};

export default AddressActions;
