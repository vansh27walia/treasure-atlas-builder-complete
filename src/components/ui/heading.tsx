
import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as = 'h2', className, children, ...props }, ref) => {
    const Component = as;
    
    return (
      <Component
        ref={ref}
        className={cn(
          'font-bold leading-tight tracking-tight',
          as === 'h1' && 'text-4xl md:text-5xl',
          as === 'h2' && 'text-3xl md:text-4xl',
          as === 'h3' && 'text-2xl md:text-3xl',
          as === 'h4' && 'text-xl md:text-2xl',
          as === 'h5' && 'text-lg md:text-xl',
          as === 'h6' && 'text-base md:text-lg',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = 'Heading';
