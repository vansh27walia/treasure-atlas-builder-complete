
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface PropertiesPanelProps {
  selectedElement: any | null;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement }) => {
  return (
    <div className="p-4 border-l-2 border-pirate-darkParchment w-64 bg-pirate-darkParchment/20">
      <h3 className="text-xl mb-4">Properties</h3>
      
      {selectedElement ? (
        <Tabs defaultValue="position">
          <TabsList className="w-full">
            <TabsTrigger value="position" className="flex-1">Position</TabsTrigger>
            <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>
          </TabsList>
          
          <TabsContent value="position" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>X Position</Label>
              <Input type="number" value={selectedElement.x} />
            </div>
            <div className="space-y-2">
              <Label>Y Position</Label>
              <Input type="number" value={selectedElement.y} />
            </div>
            <div className="space-y-2">
              <Label>Rotation: {selectedElement.rotation}°</Label>
              <Slider 
                min={0} 
                max={360} 
                step={5}
                defaultValue={[selectedElement.rotation]} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="style" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Scale: {selectedElement.scale}x</Label>
              <Slider 
                min={0.5} 
                max={2} 
                step={0.1}
                defaultValue={[selectedElement.scale]} 
              />
            </div>
            {selectedElement.type === 'text' && (
              <div className="space-y-2">
                <Label>Text</Label>
                <Input value={selectedElement.content} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center text-muted-foreground py-8 italic">
          Select an element to edit its properties
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
