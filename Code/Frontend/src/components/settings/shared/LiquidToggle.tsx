/**
 * Apple HIG Toggle Switch
 *
 * iOS-style toggle with green active state (#34C759),
 * clean spring animation, and accessible role="switch".
 * Replaces LiquidToggle with its neon-cyan glow and
 * light trail effects.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'lucide-react';

interface LiquidToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label?: string;
    description?: string;
    colorIdentity?: 'strategic' | 'tactical' | 'audit' | 'general';
    isSyncToggle?: boolean;
    disabled?: boolean;
}

const LiquidToggle: React.FC<LiquidToggleProps> = ({
    enabled,
    onChange,
    label,
    description,
    isSyncToggle = false,
    disabled = false,
}) => {
    return (
        <div className="flex items-center justify-between py-3.5 min-h-[44px]">
            <div className="flex flex-col flex-1 pr-4">
                {label && (
                    <span
                        className={cn(
                            "text-[15px] font-medium transition-colors duration-200",
                            enabled ? "text-foreground" : "text-foreground/80"
                        )}
                    >
                        {isSyncToggle && enabled && (
                            <Link size={13} className="inline-block mr-1.5 text-primary -translate-y-px" />
                        )}
                        {label}
                    </span>
                )}
                {description && (
                    <span className="text-[13px] text-muted-foreground mt-0.5 leading-snug">
                        {description}
                    </span>
                )}
            </div>

            <button
                role="switch"
                aria-checked={enabled}
                aria-label={label}
                disabled={disabled}
                onClick={() => !disabled && onChange(!enabled)}
                className={cn(
                    "relative w-[51px] h-[31px] rounded-full transition-colors duration-300 shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    enabled ? "bg-[#34C759]" : "bg-[#787880]/40",
                    disabled && "opacity-40 cursor-not-allowed"
                )}
            >
                {/* Thumb */}
                <motion.div
                    className="absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-apple-sm"
                    animate={{
                        x: enabled ? 20 : 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35
                    }}
                />
            </button>
        </div>
    );
};

export default LiquidToggle;
