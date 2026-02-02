import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X, Link } from 'lucide-react';

interface LiquidToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label?: string;
    description?: string;
    colorIdentity?: 'strategic' | 'tactical' | 'audit' | 'general';
    isSyncToggle?: boolean; // Special behaviors for the "Sync to Strategic" toggle
    disabled?: boolean;
}

const LiquidToggle: React.FC<LiquidToggleProps> = ({
    enabled,
    onChange,
    label,
    description,
    colorIdentity = 'strategic',
    isSyncToggle = false,
    disabled = false,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Color mapping for the active track/glow
    // Using CSS variables defined in index.css
    const colorMap = {
        strategic: "var(--color-strategic)",
        tactical: "var(--color-tactical)",
        audit: "var(--color-audit)",
        general: "var(--color-general)"
    };

    const activeColor = colorMap[colorIdentity];

    return (
        <div className="flex items-center justify-between py-3 group">
            <div className="flex flex-col flex-1 pr-4">
                {label && (
                    <span
                        className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            enabled ? "text-foreground" : "text-muted-foreground",
                            isSyncToggle && enabled && "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                        )}
                    >
                        {label}
                    </span>
                )}
                {description && (
                    <span className="text-xs text-muted-foreground mt-1">
                        {description}
                    </span>
                )}
            </div>

            <button
                role="switch"
                aria-checked={enabled}
                disabled={disabled}
                onClick={() => !disabled && onChange(!enabled)}
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "relative w-14 h-8 rounded-full transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]",
                    enabled ? "bg-[var(--glass-3-bg)]" : "bg-[var(--glass-1-bg)] border border-[var(--border)]",
                    disabled && "opacity-50 cursor-not-allowed grayscale"
                )}
                style={{
                    backgroundColor: enabled ? `color-mix(in oklch, ${activeColor}, transparent 80%)` : undefined,
                    borderColor: enabled ? activeColor : undefined
                }}
            >
                {/* Light Trail / Shine Effect */}
                <AnimatePresence>
                    {enabled && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 0.5, x: 20, transition: { duration: 0.5, ease: "easeOut" } }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden"
                        >
                            <div className="absolute top-0 bottom-0 w-2 bg-white blur-md skew-x-12 opacity-50 animate-flow" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The "Liquid" Thumb */}
                <motion.div
                    className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-white text-black"
                    animate={{
                        x: enabled ? 24 : 0,
                        backgroundColor: enabled ? "#ffffff" : "#71717a", // White when active, gray when inactive
                        scale: isHovered ? 1.1 : 1,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                >
                    {isSyncToggle ? (
                        <Link size={12} className={cn("transition-opacity", enabled ? "opacity-100 text-black" : "opacity-0")} />
                    ) : (
                        enabled ? <Check size={14} strokeWidth={3} /> : <X size={14} className="text-white" />
                    )}

                </motion.div>

                {/* Trailing Comet Effect on Interact (Optional advanced visual) */}
            </button>
        </div>
    );
};

export default LiquidToggle;
