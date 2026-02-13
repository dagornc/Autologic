/**
 * Apple-style Button Component
 * 
 * Clean, refined buttons following Apple HIG.
 * No shimmer or liquid fill animations.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

    const sizeClasses = {
      sm: 'h-8 px-4 text-[13px]',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    const variantClasses = {
      primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-apple-sm hover:shadow-apple-md',
      secondary: 'bg-secondary hover:bg-muted text-foreground border border-border',
      ghost: 'bg-transparent hover:bg-muted/50 text-foreground',
      neon: 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'relative overflow-hidden rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

LiquidButton.displayName = 'LiquidButton';

export { LiquidButton };
