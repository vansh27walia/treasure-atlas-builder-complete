
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader } from 'lucide-react';

interface AIRecommendation {
  bestOverall: string | null;
  bestValue: string | null;
  fastest: string | null;
  mostReliable: string | null;
  analysisText: string;
}

interface ShippingAIRecommendationProps {
  aiRecommendation: AIRecommendation | null;
  isLoading: boolean;
  onSelectRecommendation: (rateId: string) => void;
}

const ShippingAIRecommendation: React.FC<ShippingAIRecommendationProps> = ({ 
  aiRecommendation, 
  isLoading,
  onSelectRecommendation
}) => {
  if (isLoading) {
    return (
      <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex items-center">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Analyzing your shipping options...</h3>
            <p className="text-sm text-blue-600">Our AI is finding the best rate for your package</p>
          </div>
        </div>
      </Card>
    );
  }
  
  if (!aiRecommendation || !aiRecommendation.bestOverall) {
    return null;
  }

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
      <div className="flex items-start">
        <div className="mr-4 bg-blue-100 p-2 rounded-full mt-1">
          <Lightbulb className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-800 mb-1">AI Shipping Recommendation</h3>
          <p className="text-sm text-blue-600 mb-3">{aiRecommendation.analysisText}</p>
          
          <Button 
            size="sm"
            onClick={() => onSelectRecommendation(aiRecommendation.bestOverall!)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Use Recommended Option
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ShippingAIRecommendation;
