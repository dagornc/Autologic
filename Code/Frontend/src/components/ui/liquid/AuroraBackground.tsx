import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const AuroraBackground = ({ children, className }: AuroraBackgroundProps) => {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-700", className)}>
      {/* --- Atmospheric Layer --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-background" />

        {/* Aurora Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-neon-magenta/15 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-neon-violet/15 blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />

        {/* Noise Grain Overlay (Subtle Texture) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Glass Prism Overlay (Unified Tint) */}
        <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px]" />
      </div>

      {/* --- Content Layer --- */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
