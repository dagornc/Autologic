import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type GlassStrata = 1 | 2 | 3;

interface GlassSurfaceProps extends HTMLMotionProps<"div"> {
    strata?: GlassStrata;
    interactive?: boolean;
    children: React.ReactNode;
}

const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(({
    strata = 1,
    interactive = false,
    className,
    children,
    ...props
}, ref) => {

    // Base styles for all glass surfaces
    const baseStyles = "relative overflow-hidden transition-all duration-300 rounded-[var(--radius)]";

    // Specific styles for each strata tier
    const strataStyles = {
        1: "bg-[var(--glass-1-bg)] border border-[var(--glass-1-border)] backdrop-blur-[12px] saturate-140 shadow-glass-1",
        2: "bg-[var(--glass-2-bg)] border border-[var(--glass-2-border)] backdrop-blur-[24px] saturate-180 shadow-glass-2",
        3: "bg-[var(--glass-3-bg)] border border-transparent backdrop-blur-[48px] saturate-200 shadow-glass-3",
    };

    // Interactive hover effects (mainly for Strata 2 cards)
    const interactiveStyles = interactive
        ? "hover:bg-[oklch(100%_0_0_/_0.12)] hover:scale-[1.01] hover:shadow-neon-cyan/20 active:scale-[0.99]"
        : "";

    // Chromatic refraction effect for Strata 3
    const refractionEffect = strata === 3 ? (
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-br from-cyan-400/25 via-transparent to-magenta-500/25 mix-blend-overlay" />
    ) : null;

    // Border gradient for Strata 3 is handled via inline styles below

    return (
        <motion.div
            ref={ref}
            className={cn(
                baseStyles,
                strataStyles[strata],
                interactiveStyles,
                className
            )}
            style={{
                ...props.style,
                // Apply the gradient border for strata 3 if strict border-image specific logic isn't working via classes
                ...(strata === 3 ? { border: '1px solid transparent', backgroundImage: 'linear-gradient(var(--glass-3-bg), var(--glass-3-bg)), var(--glass-3-border)', backgroundOrigin: 'border-box', backgroundClip: 'content-box, border-box' } : {})
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            {...props}
        >
            {refractionEffect}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
});

GlassSurface.displayName = "GlassSurface";

export default GlassSurface;
