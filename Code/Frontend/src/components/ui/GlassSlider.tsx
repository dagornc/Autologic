/**
 * Apple HIG Slider
 *
 * Clean rounded-track slider with Apple-style thumb,
 * animated fill, and value badge. No glow effects.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassSliderProps extends React.ComponentProps<'input'> {
    label: string;
    value: number;
    colorIdentity?: 'general' | 'strategic' | 'tactical' | 'audit' | string;
    min?: number | string;
    max?: number | string;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
    label,
    value,
    colorIdentity = 'general',
    className,
    disabled,
    min = 0,
    max = 100,
    ...props
}) => {
    const percentage = useMemo(() => {
        const minVal = parseFloat(min.toString());
        const maxVal = parseFloat(max.toString());
        if (isNaN(minVal) || isNaN(maxVal)) return 0;
        return Math.min(100, Math.max(0, ((value - minVal) / (maxVal - minVal)) * 100));
    }, [value, min, max]);

    return (
        <div className={cn("py-3 space-y-3", className, disabled && "opacity-40 pointer-events-none")}>
            <div className="flex justify-between items-center">
                <label className="text-[13px] font-medium text-muted-foreground">{label}</label>
                <div className={cn(
                    "min-w-[40px] text-center px-2 py-0.5 rounded-lg bg-card border border-border",
                    "text-[13px] font-semibold tabular-nums text-foreground"
                )}>
                    {value}
                </div>
            </div>

            <div className="relative w-full h-7 flex items-center group">
                {/* Track */}
                <div className="absolute top-1/2 left-0 w-full h-[6px] -translate-y-1/2 rounded-full overflow-hidden bg-border/50">
                    {/* Filled portion */}
                    <motion.div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                        initial={false}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>

                {/* Native range input (invisible but interactive) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    disabled={disabled}
                    className={cn(
                        "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
                        disabled && "cursor-not-allowed"
                    )}
                    value={value}
                    {...props}
                />

                {/* Visual thumb */}
                <motion.div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-white shadow-apple-md pointer-events-none z-20",
                        "border border-black/5",
                        "group-hover:shadow-apple-lg transition-shadow duration-200"
                    )}
                    style={{ left: `calc(${percentage}% - 11px)` }}
                    initial={false}
                    animate={{ left: `calc(${percentage}% - 11px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>
        </div>
    );
};
