/**
 * Composant d'affichage du plan de raisonnement - Premium Layout
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Layers, ArrowRight } from 'lucide-react';
import type { ReasoningPlan } from '../../types';

interface PlanDisplayProps {
    plan: ReasoningPlan;
}

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                        Execution Plan
                    </h2>
                    <p className="text-black dark:text-slate-400 text-sm">
                        Strategic breakdown of the reasoning process
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {plan.steps.map((step, index) => (
                    <motion.div
                        key={step.step_number}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden rounded-2xl glass border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {/* Step Indicator Gradient Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />

                        <div className="p-6 pl-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] font-bold tracking-widest text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2 py-1 rounded uppercase border border-blue-500/20">
                                        Step {step.step_number.toString().padStart(2, '0')}
                                    </span>
                                    <h3 className="text-lg font-semibold text-black dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                        {step.module_name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-black dark:text-slate-500 font-mono bg-black/5 dark:bg-black/20 px-3 py-1 rounded-full border border-black/5 dark:border-white/5">
                                    <span className="uppercase opacity-50">ID</span>
                                    <span className="text-indigo-600 dark:text-indigo-300">{step.module_id}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 relative">
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-wider text-black dark:text-slate-500 font-bold flex items-center gap-2">
                                        Action <ArrowRight className="w-3 h-3 opacity-50" />
                                    </span>
                                    <p className="text-black dark:text-slate-300 text-sm leading-relaxed border-l-2 border-indigo-500/20 dark:border-slate-700/50 pl-3">
                                        {step.action}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-wider text-black dark:text-slate-500 font-bold flex items-center gap-2">
                                        Output Goal <ArrowRight className="w-3 h-3 opacity-50" />
                                    </span>
                                    <div className="text-black dark:text-indigo-200/90 text-sm leading-relaxed bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                                        {step.expected_output}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-black dark:text-yellow-500/80 text-sm backdrop-blur-sm">
                    <span>Complexity Analysis:</span>
                    <span className="font-bold capitalize text-yellow-700 dark:text-yellow-400">{plan.estimated_complexity}</span>
                </div>
            </div>
        </motion.section>
    );
};
