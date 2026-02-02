/**
 * Composant d'affichage du plan de raisonnement - Premium Layout
 */

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Layers } from 'lucide-react';
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
                <div className="h-12 w-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20 shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-colors">
                    <Layers className="w-6 h-6 text-neon-cyan" />
                </div>
                <div>
                    <h2 className="text-[28px] font-extrabold text-foreground tracking-tight">
                        Execution Plan
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Strategic architectural breakdown of the reasoning process
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
                        className="group relative overflow-hidden rounded-[28px] bg-card backdrop-blur-3xl border border-white/10 dark:border-white/10 light:border-black/5 hover:border-neon-cyan/30 transition-all duration-500 shadow-modal"
                    >
                        {/* Step Indicator Gradient Bar */}
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-neon-cyan via-neon-cyan/50 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                        <div className="p-8 pl-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 font-mono">
                                        <span className="text-[11px] font-bold tracking-widest text-neon-cyan uppercase">
                                            Step {step.step_number.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <h3 className="text-[19px] font-bold text-foreground group-hover:text-neon-cyan transition-colors">
                                        {step.module_name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary/50 border border-border font-mono">
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">MODULE_ID</span>
                                    <span className="text-[11px] font-bold text-neon-cyan/80">{step.module_id}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10 relative">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                        <div className="w-1 h-3 bg-neon-cyan/50 rounded-full" />
                                        Task Strategy
                                    </div>
                                    <p className="text-foreground/80 text-[15px] leading-relaxed pl-3 border-l border-border py-1">
                                        {step.action}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                        <div className="w-1 h-3 bg-neon-emerald/50 rounded-full" />
                                        Validation Goal
                                    </div>
                                    <div className="bg-background/40 p-5 rounded-2xl border border-border shadow-inner">
                                        <p className="text-foreground/90 text-[14px] leading-relaxed font-medium">
                                            {step.expected_output}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-card border border-border text-muted-foreground text-[12px] font-bold tracking-widest uppercase backdrop-blur-md">
                    <span>Complexity Analysis:</span>
                    <span className="text-neon-orange font-extrabold shadow-[0_0_10px_rgba(255,159,67,0.3)]">{plan.estimated_complexity}</span>
                </div>
            </div>
        </motion.section>
    );
};

