import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Search, CreditCard, CheckCircle } from 'lucide-react';
interface EnhancedWorkflowTrackerProps {
  currentStep: 'address' | 'package' | 'rates' | 'payment' | 'complete';
}
const steps = [{
  id: 'address',
  name: 'Address',
  description: 'Pickup & Drop-off',
  icon: MapPin
}, {
  id: 'package',
  name: 'Package',
  description: 'Type & Details',
  icon: Package
}, {
  id: 'rates',
  name: 'Rates',
  description: 'Compare Options',
  icon: Search
}, {
  id: 'payment',
  name: 'Payment',
  description: 'Secure Checkout',
  icon: CreditCard
}, {
  id: 'complete',
  name: 'Complete',
  description: 'Label Ready',
  icon: CheckCircle
}];
const EnhancedWorkflowTracker: React.FC<EnhancedWorkflowTrackerProps> = ({
  currentStep: initialStep
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      if (event.detail && event.detail.step) {
        setCurrentStep(event.detail.step);
      }
    };
    document.addEventListener('shipping-step-change', handleStepChange as EventListener);
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
    };
  }, []);
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };
  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };
  return <div className="w-full py-4 sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-0">
        {/* Glassy translucent container with shorter width */}
        <div className="bg-white/30 backdrop-blur-xl shadow-xl border border-white/20 p-4 transition-all duration-300 hover:bg-white/40 mx-0 rounded-3xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            return <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    {/* Step Circle with glassy effect */}
                    <div className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative shadow-lg backdrop-blur-sm
                      ${status === 'completed' ? 'bg-blue-600/80 border-blue-500 text-white shadow-blue-500/30' : status === 'current' ? 'bg-blue-100/60 border-blue-600 text-blue-700 ring-4 ring-blue-100/30 shadow-blue-500/20' : 'bg-white/50 border-gray-300/50 text-gray-400 shadow-gray-200/30'}
                    `}>
                      <Icon className="w-5 h-5" />
                      
                      {status === 'current' && <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse" />}
                    </div>
                    
                    {/* Step Text with translucent background */}
                    <div className="text-center mt-2">
                      <div className={`text-xs font-bold transition-colors duration-300 px-2 py-1 rounded-lg backdrop-blur-sm ${status === 'current' ? 'text-blue-700 bg-blue-100/40' : status === 'completed' ? 'text-blue-600 bg-blue-50/40' : 'text-gray-500 bg-gray-50/40'}`}>
                        {step.name}
                      </div>
                      <div className={`text-xs mt-1 transition-colors duration-300 ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-blue-500' : 'text-gray-400'}`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line with glassy effect */}
                  {index < steps.length - 1 && <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 backdrop-blur-sm ${status === 'completed' ? 'bg-blue-500/60' : 'bg-gray-200/40'}`} />}
                </div>;
          })}
          </div>
        </div>
      </div>
    </div>;
};
export default EnhancedWorkflowTracker;