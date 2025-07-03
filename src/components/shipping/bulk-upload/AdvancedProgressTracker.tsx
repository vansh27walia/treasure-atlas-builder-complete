import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Truck, CheckCircle, Package, FileCheck, Download, CreditCard, Clock, AlertCircle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  status: 'upcoming' | 'active' | 'completed' | 'error';
  description: string;
  estimatedTime?: string;
}

interface AdvancedProgressTrackerProps {
  uploadStatus: 'idle' | 'uploading' | 'editing' | 'success' | 'error';
  isUploading: boolean;
  isFetchingRates: boolean;
  isCreatingLabels: boolean;
  progress: number;
  totalShipments?: number;
  processedShipments?: number;
}

const AdvancedProgressTracker: React.FC<AdvancedProgressTrackerProps> = ({
  uploadStatus,
  isUploading,
  isFetchingRates,
  isCreatingLabels,
  progress,
  totalShipments = 0,
  processedShipments = 0,
}) => {
  const getProgressSteps = (): Step[] => {
    const steps: Step[] = [
      { id: 'upload', label: 'Upload CSV', icon: Upload, status: 'upcoming', description: 'Upload shipment data', estimatedTime: '< 1 min' },
      { id: 'processing', label: 'Process Data', icon: FileText, status: 'upcoming', description: 'Validate information', estimatedTime: '1-2 min' },
      { id: 'rates', label: 'Fetch Rates', icon: Truck, status: 'upcoming', description: 'Get carrier rates', estimatedTime: '2-5 min' },
      { id: 'selection', label: 'Rate Selection', icon: CheckCircle, status: 'upcoming', description: 'Choose best rates', estimatedTime: 'Manual' },
      { id: 'payment', label: 'Payment Setup', icon: CreditCard, status: 'upcoming', description: 'Configure payment', estimatedTime: '< 1 min' },
      { id: 'labels', label: 'Create Labels', icon: FileCheck, status: 'upcoming', description: 'Generate labels', estimatedTime: '3-10 min' },
      { id: 'storage', label: 'Store & Download', icon: Download, status: 'upcoming', description: 'Prepare downloads', estimatedTime: '1-2 min' }
    ];

    // Update status based on current state
    if (uploadStatus === 'idle') {
      steps[0].status = 'active';
    } else if (uploadStatus === 'uploading' || isUploading) {
      steps[0].status = 'completed';
      steps[1].status = 'active';
    } else if (uploadStatus === 'editing') {
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      if (isFetchingRates) {
        steps[2].status = 'active';
      } else {
        steps[2].status = 'completed';
        steps[3].status = 'active';
      }
    } else if (isCreatingLabels) {
      steps.slice(0, 5).forEach(step => step.status = 'completed');
      steps[5].status = 'active';
    } else if (uploadStatus === 'success') {
      steps.forEach(step => step.status = 'completed');
    }

    return steps;
  };

  const steps = getProgressSteps();
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const overallProgress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-white border-b shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Batch Label Processing</h2>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}% Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            
            return (
              <Card key={step.id} className={`p-3 text-center transition-all ${
                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                step.status === 'active' ? 'bg-blue-50 border-blue-200 shadow-md' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 mx-auto ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'active' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                
                <h3 className={`text-xs font-medium mb-1 ${
                  step.status === 'completed' ? 'text-green-800' :
                  step.status === 'active' ? 'text-blue-800' :
                  'text-gray-600'
                }`}>
                  {step.label}
                </h3>
                
                <Badge 
                  variant={step.status === 'completed' ? 'default' : step.status === 'active' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {step.status === 'completed' ? 'Done' : step.status === 'active' ? 'Active' : 'Waiting'}
                </Badge>
                
                {totalShipments > 0 && isCreatingLabels && step.status === 'active' && (
                  <div className="mt-2">
                    <Progress value={(processedShipments / totalShipments) * 100} className="h-1" />
                    <p className="text-xs text-blue-600 mt-1">{processedShipments}/{totalShipments}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancedProgressTracker;