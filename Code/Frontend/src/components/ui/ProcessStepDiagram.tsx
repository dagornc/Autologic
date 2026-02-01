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
    // Helper to determine step type
    const getStepType = (id: string): 'strategic' | 'tactical' | 'audit' => {
        if (id === 'execute' || id === 'critic') return 'tactical';
        if (id === 'audit') return 'audit';
        return 'strategic';
    };

    const getStepColor = (type: ReturnType<typeof getStepType>, isActive: boolean) => {
        if (!isActive) return 'text-zinc-500';
        switch (type) {
            case 'tactical': return 'text-emerald-600 dark:text-emerald-400';
            case 'audit': return 'text-fuchsia-600 dark:text-fuchsia-400';
            default: return 'text-indigo-600 dark:text-indigo-400';
        }
    };

    const getBorderColor = (type: ReturnType<typeof getStepType>, isActive: boolean, isCompleted: boolean) => {
        if (!isActive && !isCompleted) return 'border-black/10 dark:border-white/20';
        switch (type) {
            case 'tactical': return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
            case 'audit': return 'border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]';
            default: return 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]';
        }
    };

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
    const isAuditActive = currentStage === 'Auditing final response...';

    // Audit Animation State
    const [auditSeconds, setAuditSeconds] = React.useState(0);
    const [microLabel, setMicroLabel] = React.useState('');

    React.useEffect(() => {
        if (!isAuditActive) {
            setAuditSeconds(0);
            setMicroLabel('');
            return;
        }

        const startTime = Date.now();
        const timer = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            setAuditSeconds(seconds);

            // Cycle Micro-labels (Abstract States)
            const labels = [
                "Checking Structure...",
                "Validating Logic & Consistency...",
                "Finalizing Output..."
            ];
            setMicroLabel(labels[Math.floor(seconds / 3) % labels.length]);

        }, 1000);

        return () => clearInterval(timer);
    }, [isAuditActive]);

    /* const handleForceProceed = () => {
        // In a real implementation, this would call an API endpoint to signal the backend
        console.log("Global Force Proceed triggered");
        // Simulated client-side optimization
    }; */


    // If we're at the very beginning (Analyzing intent...), we might not have a match yet
    // but we should probably show the first step as "upcoming"
    const currentStepIndex = activeStepIndex === -1 ? 0 : activeStepIndex;

    return (
        <div className="w-full max-w-3xl mx-auto py-8">
            <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/5 dark:bg-white/10 -translate-y-1/2 z-0" />

                {/* Progress Line - Gradient to match flow */}
                <motion.div
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-fuchsia-500 -translate-y-1/2 z-0 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (currentStepIndex) / (steps.length - 1) }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ width: '100%' }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentStepIndex;
                    const isActive = index === currentStepIndex;
                    const isAuditNode = step.id === 'audit';

                    const stepType = getStepType(step.id);
                    const borderColorClass = getBorderColor(stepType, isActive, isCompleted);
                    const iconColorClass = getStepColor(stepType, isActive);

                    // Audit Specifics (Universal)
                    const iterationCount = Math.floor(auditSeconds / 10) + 1; // Simulated Pass count every 10s
                    const showPulse = isAuditNode && isActive && auditSeconds > 5;
                    // const showForceProceed = isAuditNode && isActive && auditSeconds > 10;

                    // Spinner animation for loop
                    const isLooping = isAuditNode && isActive && iterationCount > 1;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            {/* Step Circle */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted || isActive
                                        ? stepType === 'tactical' ? 'rgb(16, 185, 129)'
                                            : stepType === 'audit' ? 'rgb(217, 70, 239)'
                                                : 'rgb(99, 102, 241)'
                                        : 'rgba(255, 255, 255, 0.1)',
                                    rotate: isLooping ? 360 : 0
                                }}
                                transition={{
                                    rotate: isLooping ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 0.3 }
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 relative ${borderColorClass} ${!isActive && !isCompleted ? 'bg-white/50 dark:bg-black/50 backdrop-blur-md' : ''
                                    } ${showPulse && !isLooping ? 'animate-pulse ring-4 ring-fuchsia-500/20' : ''}`}
                            >
                                {isAuditNode && isActive ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* Circular Progress or Spinner Icon */}
                                        <Icon className="w-5 h-5 text-white z-10" />
                                    </div>
                                ) : isCompleted ? (
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
                                className={`absolute -bottom-7 whitespace-nowrap text-xs font-medium tracking-wide ${iconColorClass}`}
                            >
                                {step.label}
                            </motion.span>

                            {/* Micro Label & Pass Counter for Audit (Universal) */}
                            {isAuditNode && isActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 20 }}
                                    className="absolute -bottom-14 flex flex-col items-center gap-1"
                                >
                                    <span className="whitespace-nowrap text-[10px] text-amber-500 font-mono tracking-tight bg-black/80 px-2 py-0.5 rounded-full">
                                        {microLabel}
                                    </span>
                                    {iterationCount > 1 && (
                                        <span className="text-[9px] text-fuchsia-400 font-bold tracking-widest uppercase">
                                            PASS {iterationCount}
                                        </span>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
