/**
 * Composant d'affichage de la solution finale
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SolutionDisplayProps {
    output: string;
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ output }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-6 pb-20">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                    Final Solution
                </h2>
            </div>

            <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0f111a] overflow-hidden shadow-2xl">
                {/* Window controls */}
                <div className="absolute top-0 inset-x-0 h-8 bg-slate-200/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>

                {/* Content */}
                <div className="p-8 pt-12 overflow-x-auto">
                    <div className="font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {output}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};
