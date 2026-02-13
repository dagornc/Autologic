/**
 * Apple-style Background Component
 * 
 * Clean, minimal background with subtle mesh gradient.
 * Replaces the cyberpunk aurora orb background.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const AuroraBackground = ({ children, className }: AuroraBackgroundProps) => {
  return (
    <div className={cn(
      "relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-500",
      className
    )}>
      {/* Subtle Ambient Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-background" />

        {/* Subtle mesh gradient — very muted, Apple-style ambient light */}
        <div
          className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.04] blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.03] blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--color-apple-purple, #AF52DE) 0%, transparent 70%)' }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
