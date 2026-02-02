/**
 * Component to display the reasoning modes (cognitive modules) used by the engine.
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                        Reasoning Modes
                    </h2>
                    <p className="text-muted-foreground text-xs font-medium">
                        Selected cognitive strategies for this task
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {modes.map((mode, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-4 py-2 rounded-2xl bg-indigo-500/5 backdrop-blur-md border border-indigo-500/20 text-indigo-300 text-sm font-semibold shadow-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-default"
                    >
                        {mode}
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};
