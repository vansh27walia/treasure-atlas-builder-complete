
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ElementsLibraryProps {
  className?: string;
}

const ElementsLibrary: React.FC<ElementsLibraryProps> = ({ className }) => {
  const islandElements = [
    { id: 'island-1', name: 'Small Island', src: '/island-small.png' },
    { id: 'island-2', name: 'Medium Island', src: '/island-medium.png' },
    { id: 'island-3', name: 'Large Island', src: '/island-large.png' },
  ];
  
  const shipElements = [
    { id: 'ship-1', name: 'Pirate Ship', src: '/ship-pirate.png' },
    { id: 'ship-2', name: 'Royal Navy', src: '/ship-navy.png' },
  ];
  
  const decorElements = [
    { id: 'compass-1', name: 'Compass Rose', src: '/compass-rose.png' },
    { id: 'treasure-1', name: 'Treasure Chest', src: '/treasure-chest.png' },
    { id: 'skull-1', name: 'Skull Mark', src: '/skull-mark.png' },
  ];

  return (
    <div className={cn("p-4 border-t-2 border-pirate-darkParchment", className)}>
      <h3 className="text-xl mb-2">Elements Library</h3>
      
      <Tabs defaultValue="islands">
        <TabsList className="w-full">
          <TabsTrigger value="islands" className="flex-1">Islands</TabsTrigger>
          <TabsTrigger value="ships" className="flex-1">Ships</TabsTrigger>
          <TabsTrigger value="decor" className="flex-1">Decorations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="islands" className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            {islandElements.map((element) => (
              <div 
                key={element.id}
                className="p-2 border border-pirate-darkParchment rounded cursor-pointer hover:bg-pirate-darkParchment/30 transition-all flex flex-col items-center"
                draggable
              >
                <div className="w-16 h-16 bg-gray-200 mb-2 flex items-center justify-center">
                  {/* Placeholder for actual images */}
                  🏝️
                </div>
                <span className="text-xs text-center">{element.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ships" className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            {shipElements.map((element) => (
              <div 
                key={element.id}
                className="p-2 border border-pirate-darkParchment rounded cursor-pointer hover:bg-pirate-darkParchment/30 transition-all flex flex-col items-center"
                draggable
              >
                <div className="w-16 h-16 bg-gray-200 mb-2 flex items-center justify-center">
                  {/* Placeholder for actual images */}
                  🚢
                </div>
                <span className="text-xs text-center">{element.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="decor" className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            {decorElements.map((element) => (
              <div 
                key={element.id}
                className="p-2 border border-pirate-darkParchment rounded cursor-pointer hover:bg-pirate-darkParchment/30 transition-all flex flex-col items-center"
                draggable
              >
                <div className="w-16 h-16 bg-gray-200 mb-2 flex items-center justify-center">
                  {/* Placeholder for actual images */}
                  {element.id.includes('compass') ? '🧭' : 
                   element.id.includes('treasure') ? '💰' : 
                   element.id.includes('skull') ? '💀' : '🏴‍☠️'}
                </div>
                <span className="text-xs text-center">{element.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElementsLibrary;
