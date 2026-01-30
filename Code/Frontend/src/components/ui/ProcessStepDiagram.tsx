/**
 * Component to display a horizontal linear process diagram.
 * Visualizes the 5 main stages of the AutoLogic engine.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Search, PenTool, Layout, Play, ShieldCheck, Check } from 'lucide-react';

interface ProcessStepDiagramProps {
    currentStage: string;
}

export const ProcessStepDiagram: React.FC<ProcessStepDiagramProps> = ({ currentStage }) => {
    const steps = [
        { id: 'analyze', label: 'Analyze', icon: Search, stage: 'Analyzing request intent...' },
        { id: 'select', label: 'Selection', icon: Search, stage: 'Selecting reasoning modules...' },
        { id: 'adapt', label: 'Adaptation', icon: PenTool, stage: 'Adapting modules to context...' },
        { id: 'structure', label: 'Planning', icon: Layout, stage: 'Structuring execution plan...' },
        { id: 'verify', label: 'Verify', icon: ShieldCheck, stage: 'Verifying plan logic...' },
        { id: 'execute', label: 'Execute', icon: Play, stage: 'Executing reasoning steps...' },
        { id: 'critic', label: 'Review', icon: ShieldCheck, stage: 'Validating with H2 Critic...' },
        { id: 'synthesize', label: 'Synthesize', icon: PenTool, stage: 'Synthesizing final solution...' },
        { id: 'audit', label: 'Audit', icon: Check, stage: 'Auditing final response...' },
    ];


    // Find current step index
    const activeStepIndex = steps.findIndex(step => step.stage === currentStage);

    // If we're at the very beginning (Analyzing intent...), we might not have a match yet
    // but we should probably show the first step as "upcoming"
    const currentStepIndex = activeStepIndex === -1 ? 0 : activeStepIndex;

    return (
        <div className="w-full max-w-3xl mx-auto py-8">
            <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 dark:bg-white/10 -translate-y-1/2 z-0" />

                {/* Progress Line */}
                <motion.div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (currentStepIndex) / (steps.length - 1) }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ width: '100%' }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            {/* Step Circle */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted || isActive ? 'rgb(99, 102, 241)' : 'rgba(255, 255, 255, 0.1)',
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted || isActive
                                    ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                                    : 'border-black/10 dark:border-white/20 bg-white/50 dark:bg-black/50 backdrop-blur-md'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                                )}
                            </motion.div>

                            {/* Step Label */}
                            <motion.span
                                animate={{
                                    opacity: isActive || isCompleted ? 1 : 0.5,
                                    y: isActive ? 4 : 0
                                }}
                                className={`absolute -bottom-7 whitespace-nowrap text-xs font-medium tracking-wide ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
                                    }`}
                            >
                                {step.label}
                            </motion.span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
