/**
 * Apple-style Loading Overlay Component
 * 
 * Clean progress display with step indicator and real-time logs.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import type { LoadingStage } from '../../types';
import { ProcessFlowDiagram } from './ProcessFlowDiagram';

/** Structure d'un message de log */
export interface LogMessage {
    level: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
    timestamp: Date;
}

interface LoadingOverlayProps {
    isVisible: boolean;
    stage: LoadingStage;
    currentModel?: string | null;
    /** Les 3 derniers messages de log à afficher */
    recentLogs?: LogMessage[];
}

/** Descriptions détaillées pour chaque étape */
const STAGE_DESCRIPTIONS: Record<string, string> = {
    'Analyzing request intent...': 'Deep diving into your query to understand the core intent and nuances behind the request.',
    'Selecting reasoning modules...': 'Identifying and selecting the most appropriate reasoning modules from our library of 39 cognitive strategies.',
    'Adapting modules to context...': 'Fine-tuning selected modules to align perfectly with the specific context and constraints of your problem.',
    'Structuring execution plan...': 'Architecting a coherent, step-by-step execution plan to ensure a logical and efficient path to the solution.',
    'Verifying plan logic...': 'Rigorous self-check of the proposed plan to catch potential logical flaws or gaps before execution.',
    'Executing reasoning steps...': 'Systematically running through each step of the reasoning plan, generating intermediate insights.',
    'Validating with H2 Critic...': 'Engaging the H2 Critic model to challenge and refine the generated reasoning for maximum accuracy.',
    'Synthesizing final solution...': 'Compiling all insights and reasoning into a final, polished, and comprehensive answer.',
    'Auditing final response...': 'Performing a final quality audit to ensure the response meets all success criteria and safety standards.',
    'Stopped by user': 'Process interrupted by user command.'
};

/** Couleur selon le niveau de log */
const getLogLevelColor = (level: 'INFO' | 'WARNING' | 'ERROR'): string => {
    switch (level) {
        case 'INFO':
            return 'text-apple-blue';
        case 'WARNING':
            return 'text-apple-orange';
        case 'ERROR':
            return 'text-apple-red';
        default:
            return 'text-foreground';
    }
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, stage, currentModel, recentLogs = [] }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex flex-col items-center gap-8 w-full"
                >
                    {/* Process Flow Diagram */}
                    <div className="relative w-full overflow-hidden flex justify-center py-4">
                        <ProcessFlowDiagram currentStage={stage} />
                    </div>

                    {/* Engine Status Card */}
                    <div className="flex flex-col gap-4 px-6 md:px-8 py-6 rounded-2xl bg-card border border-border shadow-apple-lg max-w-2xl w-full mx-auto">
                        <div className="flex items-center gap-5">
                            {/* Animated Icon */}
                            <div className="relative flex-shrink-0 flex items-center justify-center">
                                <Cpu className="w-7 h-7 text-primary animate-pulse" />
                                <div className="absolute inset-0 bg-primary/10 blur-lg rounded-full" />
                            </div>

                            <div className="flex flex-col flex-1 min-w-0">
                                {/* Header Row */}
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Engine Status
                                    </span>
                                    {currentModel && (
                                        <span className="text-[11px] font-medium text-primary bg-primary/8 px-2.5 py-0.5 rounded-full border border-primary/15">
                                            {currentModel}
                                        </span>
                                    )}
                                </div>

                                {/* Stage Name */}
                                <span className="text-foreground font-semibold text-lg tracking-tight truncate mb-1">
                                    {stage.replace(/_/g, ' ')}
                                </span>

                                {/* Stage Description */}
                                <span className="text-muted-foreground text-[14px] leading-relaxed">
                                    {STAGE_DESCRIPTIONS[stage] || 'Processing...'}
                                </span>
                            </div>
                        </div>

                        {/* Recent Logs */}
                        {recentLogs.length > 0 && (
                            <div className="mt-1 pt-3 border-t border-border">
                                <div className="flex flex-col gap-1.5 overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        {recentLogs.map((log) => (
                                            <motion.div
                                                key={`log-${log.timestamp.getTime()}-${log.message.slice(0, 20)}`}
                                                initial={{ opacity: 0, y: 8, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                exit={{ opacity: 0, y: -8, height: 0 }}
                                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="flex items-start gap-2 text-[13px] font-mono"
                                            >
                                                <span className={`font-semibold ${getLogLevelColor(log.level)} min-w-[65px] shrink-0`}>
                                                    [{log.level}]
                                                </span>
                                                <span className={`${getLogLevelColor(log.level)} break-words`}>
                                                    {log.message}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
