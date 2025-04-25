
import React, { useState } from 'react';
import Header from '@/components/Header';
import MapCanvas from '@/components/MapCanvas';
import Toolbar from '@/components/Toolbar';
import PropertiesPanel from '@/components/PropertiesPanel';
import ElementsLibrary from '@/components/ElementsLibrary';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedElement, setSelectedElement] = useState(null);

  const handleSelectTool = (tool: string) => {
    setSelectedTool(tool);
    toast(`Selected tool: ${tool}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Toolbar 
          onSelectTool={handleSelectTool}
          selectedTool={selectedTool}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            <MapCanvas className="mx-auto" />
          </div>
          
          <ElementsLibrary className="h-64" />
        </div>
        
        <PropertiesPanel selectedElement={selectedElement} />
      </div>
    </div>
  );
};

export default Index;
