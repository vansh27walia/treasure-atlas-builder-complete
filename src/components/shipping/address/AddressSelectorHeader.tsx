
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AddressSelectorHeaderProps {
  type: 'from' | 'to';
  allowAddNew?: boolean;
}

const AddressSelectorHeader: React.FC<AddressSelectorHeaderProps> = ({ 
  type,
  allowAddNew = true
}) => {
  const navigate = useNavigate();
  
  const goToAddressSettings = () => {
    navigate('/settings');
  };
  
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium">
        {type === 'from' ? 'Pickup' : 'Delivery'} Address
      </h3>
      
      <div className="flex items-center gap-2">
        {allowAddNew && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs" 
            onClick={goToAddressSettings}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add New
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs" 
          onClick={goToAddressSettings}
        >
          <Settings className="h-3.5 w-3.5 mr-1" />
          Manage
        </Button>
      </div>
    </div>
  );
};

export default AddressSelectorHeader;
