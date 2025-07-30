
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Percent } from 'lucide-react';

interface DynamicDiscountBadgeProps {
  rate: any;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const DynamicDiscountBadge: React.FC<DynamicDiscountBadgeProps> = ({
  rate,
  size = 'md',
  showIcon = true
}) => {
  const calculateDiscount = () => {
    const originalPrice = parseFloat(rate.list_rate || rate.retail_rate || rate.original_rate || rate.rate);
    const currentPrice = parseFloat(rate.rate);
    
    if (originalPrice > currentPrice) {
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount();

  if (discount === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const getDiscountColor = (discount: number) => {
    if (discount >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (discount >= 50) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (discount >= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <Badge 
      className={`${sizeClasses[size]} ${getDiscountColor(discount)} font-medium border`}
    >
      {showIcon && <TrendingDown className="w-3 h-3 mr-1" />}
      {discount}% OFF
    </Badge>
  );
};

export default DynamicDiscountBadge;
