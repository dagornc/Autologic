/**
 * Apple-style Card Component
 * 
 * Clean grouped card with subtle shadow and rounded corners.
 * Replaces the cyberpunk CrystalCard with neon hover effects.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CrystalCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: 'default' | 'highlight' | 'neon';
  hoverEffect?: 'none' | 'lift' | 'tilt' | 'glow';
  children?: React.ReactNode;
}

const CrystalCard = React.forwardRef<HTMLDivElement, CrystalCardProps>(
  ({ className, variant = 'default', hoverEffect = 'lift', children, ...props }, ref) => {

    const variants = {
      default: 'bg-card border border-border shadow-apple-sm',
      highlight: 'bg-card border border-primary/20 shadow-apple-md',
      neon: 'bg-card border border-primary/30 shadow-apple-md',
    };

    const hoverAnimations = {
      none: {},
      lift: { y: -2, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
      tilt: { scale: 1.005, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
      glow: { boxShadow: "0 4px 20px rgba(0, 122, 255, 0.1)" },
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={hoverAnimations[hoverEffect]}
        className={cn(
          'relative rounded-2xl overflow-hidden transition-shadow duration-300',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

CrystalCard.displayName = 'CrystalCard';

export { CrystalCard };
