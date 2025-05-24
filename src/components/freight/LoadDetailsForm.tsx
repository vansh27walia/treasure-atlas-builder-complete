
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Container } from 'lucide-react';
import LooseCargoForm from './LooseCargoForm';
import ContainerForm from './ContainerForm';
import { FreightLoadDetails } from '@/types/freight';

interface LoadDetailsFormProps {
  loadData: FreightLoadDetails;
  onLoadChange: (data: FreightLoadDetails) => void;
}

const LoadDetailsForm: React.FC<LoadDetailsFormProps> = ({
  loadData,
  onLoadChange
}) => {
  const handleTabChange = (value: string) => {
    onLoadChange({
      type: value as 'loose-cargo' | 'containers',
      loads: [] // Reset loads when switching tabs
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Package className="w-5 h-5 text-purple-600 mr-2" />
          Load Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={loadData.type} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loose-cargo" className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Loose Cargo
            </TabsTrigger>
            <TabsTrigger value="containers" className="flex items-center">
              <Container className="w-4 h-4 mr-2" />
              Containers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loose-cargo" className="mt-6">
            <LooseCargoForm
              loads={loadData.loads}
              onChange={(loads) => onLoadChange({ ...loadData, loads })}
            />
          </TabsContent>

          <TabsContent value="containers" className="mt-6">
            <ContainerForm
              loads={loadData.loads}
              onChange={(loads) => onLoadChange({ ...loadData, loads })}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LoadDetailsForm;
