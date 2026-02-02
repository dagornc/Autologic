/**
 * Composant d'overlay de chargement avec animation des stages
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import type { LoadingStage } from '../../types';
import { ProcessFlowDiagram } from './ProcessFlowDiagram';

interface LoadingOverlayProps {
    isVisible: boolean;
    stage: LoadingStage;
    currentModel?: string | null;
}

// Mapping des descriptions détaillées pour chaque étape
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

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, stage, currentModel }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-10 w-full"
                >
                    <div className="relative w-full overflow-hidden flex justify-center py-4">
                        <ProcessFlowDiagram currentStage={stage} />
                    </div>

                    <div className="flex items-center gap-6 px-10 py-5 rounded-2xl bg-secondary/20 border border-border backdrop-blur-3xl shadow-modal max-w-2xl w-full mx-auto">
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                            <Cpu className="w-8 h-8 text-neon-cyan animate-pulse" />
                            <div className="absolute inset-0 bg-neon-cyan/20 blur-md rounded-full animate-pulse" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-foreground/50 uppercase tracking-[0.25em] font-mono">Engine Status</span>
                                {currentModel && (
                                    <span className="text-[10px] font-medium text-neon-cyan/70 font-mono bg-neon-cyan/5 px-2 py-0.5 rounded-full border border-neon-cyan/10">
                                        {currentModel}
                                    </span>
                                )}
                            </div>
                            <span className="text-foreground font-mono text-xl font-bold tracking-widest uppercase truncate mb-2">
                                {stage.replace(/_/g, ' ')}
                            </span>
                            <span className="text-muted-foreground text-sm font-medium leading-relaxed">
                                {STAGE_DESCRIPTIONS[stage] || 'Processing...'}
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

