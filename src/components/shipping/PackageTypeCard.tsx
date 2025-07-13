
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PackageTypeCardProps {
  icon: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  image?: string;
  isRecommended?: boolean;
}

const PackageTypeCard: React.FC<PackageTypeCardProps> = ({ 
  icon, 
  title, 
  description, 
  isSelected, 
  onClick,
  image,
  isRecommended = false
}) => {
  return (
    <Card 
      className={`relative p-4 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
        isSelected 
          ? 'border-2 border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
          : 'border border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50'
      }`}
      onClick={onClick}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1">
          Recommended
        </Badge>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-center space-x-4">
        {/* Package Visual */}
        <div className="flex-shrink-0">
          {image ? (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              <img 
                src={image} 
                alt={title} 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="text-3xl hidden">{icon}</div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="text-3xl">{icon}</div>
            </div>
          )}
        </div>

        {/* Package Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm mb-1 truncate ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {title}
          </h4>
          <p className={`text-xs leading-relaxed ${
            isSelected ? 'text-blue-700' : 'text-gray-600'
          }`}>
            {description}
          </p>
        </div>
      </div>

      {/* Hover Effect */}
      <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
        isSelected ? 'opacity-0' : 'opacity-0 hover:opacity-100'
      } bg-gradient-to-r from-blue-500/5 to-purple-500/5`} />
    </Card>
  );
};

export default PackageTypeCard;
