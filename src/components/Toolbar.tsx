
import React from 'react';
import { Ship, Map, Sword, Compass, Skull, Waves, Flag, Anchor, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarProps {
  onSelectTool: (tool: string) => void;
  selectedTool: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSelectTool, selectedTool }) => {
  const tools = [
    { id: 'select', icon: <Map />, label: 'Select & Move' },
    { id: 'island', icon: <Waves />, label: 'Add Island' },
    { id: 'ship', icon: <Ship />, label: 'Add Ship' },
    { id: 'treasure', icon: <Flag />, label: 'Add Treasure' },
    { id: 'compass', icon: <Compass />, label: 'Add Compass Rose' },
    { id: 'sea-monster', icon: <Skull />, label: 'Add Sea Monster' },
    { id: 'text', icon: <Anchor />, label: 'Add Text' },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 p-3 border-r-2 border-pirate-darkParchment bg-pirate-darkParchment/20 h-full">
        {tools.map((tool) => (
          <Tooltip key={tool.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === tool.id ? "default" : "ghost"}
                className={`toolbar-item w-10 h-10 p-0 ${selectedTool === tool.id ? 'bg-pirate-gold text-white' : ''}`}
                onClick={() => onSelectTool(tool.id)}
              >
                {React.cloneElement(tool.icon, { className: 'h-6 w-6' })}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        <Separator className="my-2" />
        
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="toolbar-item w-10 h-10 p-0 text-pirate-red">
              <Trash2 className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Delete Selected</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;
