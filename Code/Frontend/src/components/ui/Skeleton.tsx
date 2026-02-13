/**
 * Apple-style Skeleton Loader
 *
 * Shimmer effect for loading states. Apple HIG 2025: subtle
 * pulse animation with rounded shapes.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    /** Variant: line, card, circle */
    variant?: 'line' | 'card' | 'circle' | 'chip';
    count?: number;
}

const shimmerVariants = {
    initial: { opacity: 0.4 },
    animate: { opacity: [0.4, 0.7, 0.4] },
};

const SkeletonLine: React.FC<{ className?: string }> = ({ className }) => (
    <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className={`rounded-lg bg-muted ${className || 'h-4 w-full'}`}
    />
);

const SkeletonCard: React.FC = () => (
    <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl bg-card border border-border p-5 space-y-3"
    >
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-lg w-3/4" />
                <div className="h-3 bg-muted rounded-lg w-1/2" />
            </div>
        </div>
        <div className="space-y-2 pt-2">
            <div className="h-3 bg-muted rounded-lg w-full" />
            <div className="h-3 bg-muted rounded-lg w-5/6" />
            <div className="h-3 bg-muted rounded-lg w-2/3" />
        </div>
    </motion.div>
);

const SkeletonChip: React.FC = () => (
    <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="h-9 w-24 rounded-full bg-muted"
    />
);

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'line',
    count = 1,
}) => {
    const items = Array.from({ length: count }, (_, i) => i);

    switch (variant) {
        case 'card':
            return (
                <div className={`space-y-3 ${className || ''}`}>
                    {items.map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            );
        case 'chip':
            return (
                <div className={`flex flex-wrap gap-2 ${className || ''}`}>
                    {items.map((i) => (
                        <SkeletonChip key={i} />
                    ))}
                </div>
            );
        case 'circle':
            return (
                <div className={`flex gap-3 ${className || ''}`}>
                    {items.map((i) => (
                        <motion.div
                            key={i}
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-10 h-10 rounded-full bg-muted"
                        />
                    ))}
                </div>
            );
        default:
            return (
                <div className={`space-y-2.5 ${className || ''}`}>
                    {items.map((i) => (
                        <SkeletonLine key={i} className={className} />
                    ))}
                </div>
            );
    }
};
