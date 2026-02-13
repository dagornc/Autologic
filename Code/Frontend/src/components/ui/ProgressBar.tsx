/**
 * Apple-style Segmented Progress Bar
 *
 * Displays global reasoning progress with 9 distinct segments,
 * percentage, time elapsed, and current step label.
 * Apple HIG 2025: subtle rounded segments, gradient fill.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { LoadingStage } from '../../types';

interface ProgressBarProps {
    currentStage: LoadingStage;
    isVisible: boolean;
}

/** Ordered reasoning stages for progress tracking */
const STAGES: LoadingStage[] = [
    'Analyzing request intent...',
    'Selecting reasoning modules...',
    'Adapting modules to context...',
    'Structuring execution plan...',
    'Verifying plan logic...',
    'Executing reasoning steps...',
    'Validating with H2 Critic...',
    'Synthesizing final solution...',
    'Auditing final response...',
];

const STAGE_SHORT_LABELS: Record<string, string> = {
    'Analyzing request intent...': 'Analyze',
    'Selecting reasoning modules...': 'Select',
    'Adapting modules to context...': 'Adapt',
    'Structuring execution plan...': 'Plan',
    'Verifying plan logic...': 'Verify',
    'Executing reasoning steps...': 'Execute',
    'Validating with H2 Critic...': 'H2 Critic',
    'Synthesizing final solution...': 'Synthesize',
    'Auditing final response...': 'Audit',
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStage, isVisible }) => {
    const { t } = useTranslation();
    const [startTime] = useState(() => Date.now());
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const activeIndex = STAGES.indexOf(currentStage);
    const currentStep = activeIndex >= 0 ? activeIndex + 1 : 0;
    const totalSteps = STAGES.length;
    const percentage = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

    // Estimate remaining time based on average speed
    const avgPerStep = currentStep > 0 ? elapsed / currentStep : 0;
    const remainingSteps = totalSteps - currentStep;
    const estimatedRemaining = avgPerStep * remainingSteps;

    useEffect(() => {
        if (isVisible) {
            intervalRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isVisible, startTime]);

    if (!isVisible || currentStep === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-4xl mx-auto space-y-3"
        >
            {/* Header row */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[13px] font-semibold text-foreground">
                    {t('progress.step', { current: currentStep, total: totalSteps })}
                    <span className="text-muted-foreground font-normal ml-2">
                        — {STAGE_SHORT_LABELS[currentStage] || currentStage}
                    </span>
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-muted-foreground">
                        {formatTime(elapsed)} {t('progress.elapsed')}
                    </span>
                    {estimatedRemaining > 0 && (
                        <>
                            <div className="w-px h-3 bg-border" />
                            <span className="text-[12px] font-medium text-primary">
                                ~{formatTime(estimatedRemaining)} {t('progress.remaining')}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted/40">
                {STAGES.map((stage, i) => {
                    const isCompleted = i < activeIndex;
                    const isActive = i === activeIndex;
                    return (
                        <motion.div
                            key={stage}
                            className="flex-1 rounded-full relative overflow-hidden"
                            initial={false}
                            animate={{
                                backgroundColor: isCompleted
                                    ? 'var(--primary)'
                                    : isActive
                                        ? 'var(--primary)'
                                        : 'transparent',
                                opacity: isCompleted ? 1 : isActive ? 0.7 : 0.15,
                            }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {isActive && (
                                <motion.div
                                    className="absolute inset-0 bg-primary"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Percentage */}
            <div className="flex justify-center">
                <span className="text-[24px] font-bold text-foreground tabular-nums">
                    {percentage}
                    <span className="text-[14px] text-muted-foreground font-medium">%</span>
                </span>
            </div>
        </motion.div>
    );
};
