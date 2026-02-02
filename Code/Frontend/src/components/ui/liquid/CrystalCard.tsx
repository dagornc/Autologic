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
      default: 'glass-panel',
      highlight: 'glass-panel bg-glass-highlight/50 border-glass-highlight',
      neon: 'bg-glass-bg border border-neon-cyan/30 shadow-neon-cyan',
    };

    const hoverAnimations = {
      none: {},
      lift: { y: -5, transition: { duration: 0.3 } },
      tilt: { rotateX: 2, rotateY: 2, scale: 1.01 },
      glow: { boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)" },
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hoverAnimations[hoverEffect]}
        className={cn(
          'relative rounded-3xl p-6 overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      >
        {/* Inner Reflection/Noise Texture (Optional for later) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

CrystalCard.displayName = 'CrystalCard';

export { CrystalCard };
