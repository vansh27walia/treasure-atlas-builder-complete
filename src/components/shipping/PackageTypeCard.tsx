
import React from 'react';
import { Card } from '@/components/ui/card';

interface PackageTypeCardProps {
  icon: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  image?: string;
}

const PackageTypeCard: React.FC<PackageTypeCardProps> = ({ 
  icon, 
  title, 
  description, 
  isSelected, 
  onClick,
  image 
}) => {
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {image ? (
          <img src={image} alt={title} className="w-12 h-12 object-contain" />
        ) : (
          <div className="text-2xl">{icon}</div>
        )}
        <div className="flex-1">
          <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
            {title}
          </h4>
          <p className={`text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PackageTypeCard;
