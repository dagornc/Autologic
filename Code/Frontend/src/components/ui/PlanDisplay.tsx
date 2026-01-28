/**
 * Composant d'affichage du plan de raisonnement
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import type { ReasoningPlan } from '../../types';

interface PlanDisplayProps {
    plan: ReasoningPlan;
}

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } },
};

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                    Execution Plan
                </h2>
            </div>

            <div className="grid gap-4">
                {plan.steps.map((step, index) => (
                    <motion.div
                        key={step.step_number}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                    >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="p-6 pl-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-blue-600 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-1 rounded">
                                        STEP {step.step_number.toString().padStart(2, '0')}
                                    </span>
                                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                                        {step.module_name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono uppercase tracking-wider">
                                    <span>Module ID:</span>
                                    <span className="text-slate-500 dark:text-slate-400">{step.module_id}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Action</span>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{step.action}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Expected Output</span>
                                    <p className="text-indigo-800 dark:text-indigo-200/80 text-sm leading-relaxed bg-indigo-500/5 dark:bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/10">
                                        {step.expected_output}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 text-sm">
                    <span>Complexity Level:</span>
                    <span className="font-bold capitalize">{plan.estimated_complexity}</span>
                </div>
            </div>
        </motion.section>
    );
};
