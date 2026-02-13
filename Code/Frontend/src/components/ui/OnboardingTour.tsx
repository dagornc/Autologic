/**
 * Apple-style Onboarding Tour (Coach Marks)
 *
 * Spotlight-based guided tutorial for first-time users.
 * Steps highlight key sections with explanatory tooltips.
 * Stored in localStorage to show only once.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'autologic_onboarding_completed';

interface TourStep {
    titleKey: string;
    descKey: string;
    position: 'center' | 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
    {
        titleKey: 'onboarding.step1.title',
        descKey: 'onboarding.step1.desc',
        position: 'center',
    },
    {
        titleKey: 'onboarding.step2.title',
        descKey: 'onboarding.step2.desc',
        position: 'center',
    },
    {
        titleKey: 'onboarding.step3.title',
        descKey: 'onboarding.step3.desc',
        position: 'center',
    },
    {
        titleKey: 'onboarding.step4.title',
        descKey: 'onboarding.step4.desc',
        position: 'center',
    },
];

export const OnboardingTour: React.FC = () => {
    const { t } = useTranslation();
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            // Short delay for page to render
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = useCallback(() => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex((prev) => prev + 1);
        } else {
            handleDismiss();
        }
    }, [stepIndex]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    if (!isVisible) return null;

    const step = TOUR_STEPS[stepIndex];
    const isLast = stepIndex === TOUR_STEPS.length - 1;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleDismiss}
                />

                {/* Central tooltip card */}
                <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative z-10 max-w-md w-full mx-4 rounded-3xl bg-card border border-border shadow-apple-xl overflow-hidden"
                >
                    {/* Top gradient bar */}
                    <div className="h-1 bg-gradient-to-r from-apple-blue via-apple-purple to-apple-blue" />

                    <div className="p-8 space-y-5">
                        {/* Icon */}
                        <div className="flex items-center justify-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-primary" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center space-y-2">
                            <h3 className="text-[20px] font-bold text-foreground tracking-tight">
                                {t(step.titleKey)}
                            </h3>
                            <p className="text-[15px] text-muted-foreground leading-relaxed">
                                {t(step.descKey)}
                            </p>
                        </div>

                        {/* Step Indicators */}
                        <div className="flex items-center justify-center gap-1.5">
                            {TOUR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex
                                            ? 'w-6 bg-primary'
                                            : i < stepIndex
                                                ? 'w-1.5 bg-primary/40'
                                                : 'w-1.5 bg-muted'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={handleDismiss}
                                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-3"
                            >
                                {t('onboarding.skip')}
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-apple-sm min-h-[44px]"
                            >
                                {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
