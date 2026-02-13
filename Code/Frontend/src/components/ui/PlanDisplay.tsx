/**
 * Apple-style Plan Display Component
 * 
 * Shows execution plan steps in Apple grouped card layout.
 */

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Layers } from 'lucide-react';
import type { ReasoningPlan } from '../../types';

interface PlanDisplayProps {
    plan: ReasoningPlan;
}

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } },
};

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
    return (
        <motion.section variants={itemVariants} className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                        Execution Plan
                    </h2>
                    <p className="text-muted-foreground text-[14px]">
                        Strategic breakdown of the reasoning process
                    </p>
                </div>
            </div>

            {/* Plan Steps — Apple Grouped Card Style */}
            <div className="rounded-2xl bg-card border border-border shadow-apple-sm overflow-hidden divide-y divide-border">
                {plan.steps.map((step, index) => (
                    <motion.div
                        key={step.step_number}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                        className="group hover:bg-muted/30 transition-colors duration-200"
                    >
                        <div className="p-5 md:p-6">
                            {/* Step Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/8 text-[12px] font-semibold tracking-wide text-primary">
                                        Step {step.step_number.toString().padStart(2, '0')}
                                    </span>
                                    <h3 className="text-[16px] font-semibold text-foreground">
                                        {step.module_name}
                                    </h3>
                                </div>
                                <span className="text-[12px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                    {step.module_id}
                                </span>
                            </div>

                            {/* Step Content */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Task Strategy
                                    </span>
                                    <p className="text-foreground/80 text-[14px] leading-relaxed pl-3 border-l-2 border-primary/20">
                                        {step.action}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Validation Goal
                                    </span>
                                    <div className="bg-muted/30 p-4 rounded-xl">
                                        <p className="text-foreground/90 text-[14px] leading-relaxed">
                                            {step.expected_output}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Complexity Badge */}
            <div className="flex justify-end pt-2">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card border border-border text-[13px] font-medium text-muted-foreground shadow-apple-sm">
                    <span>Complexity:</span>
                    <span className="text-apple-orange font-semibold">{plan.estimated_complexity}</span>
                </div>
            </div>
        </motion.section>
    );
};
