/**
 * Apple HIG Card Surface
 *
 * Clean grouped card with subtle shadow, rounded corners,
 * and optional entry animation. Replaces the old GlassSurface
 * with its chromatic refraction effects.
 */

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

    const baseStyles = "relative overflow-hidden transition-all duration-300 rounded-2xl";

    const strataStyles = {
        1: "bg-card border border-border shadow-apple-sm",
        2: "bg-card border border-border shadow-apple-md",
        3: "bg-card/95 backdrop-blur-xl border border-border shadow-apple-lg",
    };

    const interactiveStyles = interactive
        ? "hover:bg-card/90 hover:shadow-apple-md active:scale-[0.99] transition-transform"
        : "";

    return (
        <motion.div
            ref={ref}
            className={cn(
                baseStyles,
                strataStyles[strata],
                interactiveStyles,
                className
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            {...props}
        >
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
});

GlassSurface.displayName = "GlassSurface";

export default GlassSurface;
