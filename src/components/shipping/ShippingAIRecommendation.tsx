
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Loader } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      <Card className="border-2 border-amber-200 bg-amber-50 mb-4">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader className="animate-spin h-5 w-5 mr-2 text-amber-600" />
          <p className="text-amber-800">AI is analyzing shipping options...</p>
        </CardContent>
      </Card>
    );
  }

  if (!aiRecommendation) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-200 bg-amber-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <Lightbulb className="h-6 w-6 text-amber-600 mr-2" />
          <h3 className="text-lg font-semibold text-amber-800">AI Shipping Recommendations</h3>
        </div>

        <p className="text-sm text-amber-900 mb-4">{aiRecommendation.analysisText}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {aiRecommendation.bestOverall && (
            <RecommendationButton
              label="Best Overall"
              description="Balanced combination of cost, speed and reliability"
              color="bg-purple-600"
              onClick={() => onSelectRecommendation(aiRecommendation.bestOverall!)}
            />
          )}

          {aiRecommendation.bestValue && (
            <RecommendationButton
              label="Best Value"
              description="Most economical option for the service level"
              color="bg-green-600"
              onClick={() => onSelectRecommendation(aiRecommendation.bestValue!)}
            />
          )}

          {aiRecommendation.fastest && (
            <RecommendationButton
              label="Fastest Delivery"
              description="Quickest estimated delivery time"
              color="bg-blue-600"
              onClick={() => onSelectRecommendation(aiRecommendation.fastest!)}
            />
          )}

          {aiRecommendation.mostReliable && (
            <RecommendationButton
              label="Most Reliable"
              description="Highest carrier reliability rating"
              color="bg-amber-600"
              onClick={() => onSelectRecommendation(aiRecommendation.mostReliable!)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface RecommendationButtonProps {
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}

const RecommendationButton: React.FC<RecommendationButtonProps> = ({
  label,
  description,
  color,
  onClick
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          onClick={onClick}
          className={`${color} hover:opacity-90 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all`}
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default ShippingAIRecommendation;
