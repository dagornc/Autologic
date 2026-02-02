import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming this alias exists, otherwise I'll need to check tsconfig.

interface LiquidButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    // Size Map
    const sizeClasses = {
      sm: 'h-8 px-4 text-xs',
      md: 'h-10 px-6 text-sm',
      lg: 'h-12 px-8 text-base',
    };

    // Variant Map (Liquid Glass Styles)
    const variantClasses = {
      primary: 'bg-primary/80 hover:bg-primary text-primary-foreground border border-white/20 shadow-lg hover:shadow-primary/30',
      secondary: 'bg-glass-bg hover:bg-white/10 text-foreground border border-glass-border hover:border-white/30',
      ghost: 'bg-transparent hover:bg-white/5 text-foreground/80 hover:text-foreground',
      neon: 'bg-transparent border border-neon-cyan/50 text-neon-cyan shadow-neon-cyan hover:bg-neon-cyan/10',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'relative overflow-hidden rounded-xl font-medium transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Liquid Background Layer (Animated on Hover) */}
        <motion.div
          className="absolute inset-0 bg-white/10 z-0"
          initial={{ y: '100%' }}
          whileHover={{ y: '0%' }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* Shimmer Effect */}
        <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"
            animate={{ translateX: ['100%', '200%'] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 3 }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && (
             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          )}
          {children}
        </span>
      </motion.button>
    );
  }
);

LiquidButton.displayName = 'LiquidButton';

export { LiquidButton };
