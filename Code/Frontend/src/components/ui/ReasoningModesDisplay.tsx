/**
 * Apple-style Reasoning Modes Display
 * 
 * Shows selected cognitive strategies as pill badges.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

interface ReasoningModesDisplayProps {
    modes: string[];
}

export const ReasoningModesDisplay: React.FC<ReasoningModesDisplayProps> = ({ modes }) => {
    if (!modes || modes.length === 0) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-5"
        >
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-apple-purple/10 flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-apple-purple" />
                </div>
                <div>
                    <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                        Reasoning Modes
                    </h2>
                    <p className="text-muted-foreground text-[13px]">
                        Selected cognitive strategies for this task
                    </p>
                </div>
            </div>

            {/* Mode Badges */}
            <div className="flex flex-wrap gap-2">
                {modes.map((mode, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.04, duration: 0.2 }}
                        className="px-3.5 py-1.5 rounded-full bg-apple-purple/8 border border-apple-purple/15 text-apple-purple text-[13px] font-medium transition-colors hover:bg-apple-purple/12 cursor-default"
                    >
                        {mode}
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};
