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
    // Calculate percentage for the filled track background
    const percentage = useMemo(() => {
        const minVal = parseFloat(min.toString());
        const maxVal = parseFloat(max.toString());
        const currentVal = value;
        if (isNaN(minVal) || isNaN(maxVal)) return 0;
        return Math.min(100, Math.max(0, ((currentVal - minVal) / (maxVal - minVal)) * 100));
    }, [value, min, max]);

    return (
        <div className={cn("py-2 space-y-3", className, disabled && "opacity-50 grayscale pointer-events-none")}>
            <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</label>
                <div className={cn(
                    "px-2 py-0.5 rounded-md bg-background/50 border border-white/10 shadow-sm",
                    "text-xs font-mono font-bold",
                    `text-[var(--color-${colorIdentity})]`
                )}>
                    {value}
                </div>
            </div>

            <div className="relative w-full h-6 flex items-center group">
                {/* Track Background */}
                <div className="absolute top-1/2 left-0 w-full h-1.5 -translate-y-1/2 rounded-full overflow-hidden bg-[var(--glass-border)]/30 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                    {/* Filled portion */}
                    <motion.div
                        className={cn(
                            "h-full relative",
                            `bg-[var(--color-${colorIdentity})]`
                        )}
                        style={{ width: `${percentage}%` }}
                        initial={false}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="absolute inset-0 bg-white/20" /> {/* Shine on fill */}
                    </motion.div>
                </div>

                {/* The Input Range (Invisible but interactive) */}
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

                {/* Custom Thumb (Visual Only) */}
                <motion.div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg border-2 border-white/80 pointer-events-none z-20",
                        `bg-[var(--color-${colorIdentity})]`,
                        "group-hover:scale-110 group-active:scale-95 transition-transform duration-200"
                    )}
                    style={{ left: `calc(${percentage}% - 10px)` }} // Center the thumb (half width)
                    initial={false}
                    animate={{ left: `calc(${percentage}% - 10px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Glow effect */}
                    <div className={cn(
                        "absolute inset-0 rounded-full opacity-50 blur-sm",
                        `bg-[var(--color-${colorIdentity})]`
                    )} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-transparent" />
                </motion.div>
            </div>
        </div>
    );
};
