import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface ToggleButtonProps {
  collapsed: boolean;
  onClick: () => void;
}
const ToggleButton: React.FC<ToggleButtonProps> = ({
  collapsed,
  onClick
}) => {
  return <Button variant="ghost" size="icon" onClick={onClick} className="hover:bg-blue-800 ml-auto text-slate-100">
      {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </Button>;
};
export default ToggleButton;