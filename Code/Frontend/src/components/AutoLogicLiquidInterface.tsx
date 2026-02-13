/**
 * AutoLogic Liquid Interface — Apple HIG 2025
 *
 * Main application shell with Apple-style frosted glass navigation,
 * clean content layout, responsive design, and integrated UX improvements:
 * - SuggestionChips for empty-state guidance
 * - ProgressBar for real-time progress tracking
 * - ToastProvider for system notifications
 * - OnboardingTour for first-time user guidance
 * - Keyboard shortcuts (⌘+Enter, ⌘+K, etc.)
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import SettingsDrawer from './SettingsDrawer';
import { HelpDisplay } from './HelpDisplay';
import { PromptsManager } from './PromptsManager';
import HistoryDisplay from './HistoryDisplay';
import {
    TaskInput,
    LoadingOverlay,
    ErrorMessage,
    PlanDisplay,
    SolutionDisplay,
    ReasoningModesDisplay,
    SuggestionChips,
    ToastProvider,
    useToast,
    ProgressBar,
    OnboardingTour,
} from './ui';
import { AuroraBackground } from './ui/liquid/AuroraBackground';
import { GlassNavigation } from './ui/liquid/GlassNavigation';
import { CrystalCard } from './ui/liquid/CrystalCard';
import { useTheme } from '../hooks/useTheme';
import { usePersistedSettings } from '../hooks/useSettings';
import { useAutoLogic } from '../hooks/useAutoLogic';
import { useRouting } from '../hooks/useRouting';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';


const AutoLogicLiquidContent: React.FC = () => {
    const { t } = useTranslation();
    const { activeSection, isSettingsOpen, navigateTo, closeSettings } = useRouting();
    const [config, setConfig] = usePersistedSettings(DEFAULT_SETTINGS);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        currentModel,
        recentLogs,
        submitTask,
        stopTask,
    } = useAutoLogic();

    const { theme, setTheme } = useTheme();
    const { showToast, setProgressTitle } = useToast();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleSubmit = useCallback(() => {
        if (!task.trim() || isLoading) return;
        submitTask(config);
    }, [task, isLoading, submitTask, config]);

    const handleSelectPrompt = (content: string) => {
        setTask(content);
        navigateTo('home');
    };

    const handleSuggestionSelect = (text: string) => {
        setTask(text);
        // Focus the input after selecting a suggestion
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Dynamic page title during loading
    React.useEffect(() => {
        if (isLoading && loadingStage) {
            const stageLabel = loadingStage.replace(/\.\.\.$/, '');
            setProgressTitle(`⏳ ${stageLabel} — AutoLogic`);
        } else if (result && !isLoading) {
            setProgressTitle(null);
            // Show success toast
            showToast('success', t('toast.taskComplete'), t('toast.taskCompleteMsg'));
        } else {
            setProgressTitle(null);
        }
    }, [isLoading, loadingStage, result, setProgressTitle, showToast, t]);

    // Show error toast
    React.useEffect(() => {
        if (error) {
            showToast('error', t('toast.taskError'), error);
        }
    }, [error, showToast, t]);

    // Keyboard shortcuts
    const shortcutActions = useMemo(() => ({
        onSubmit: handleSubmit,
        onFocusInput: () => {
            navigateTo('home');
            setTimeout(() => inputRef.current?.focus(), 100);
        },
        onOpenSettings: () => navigateTo('settings'),
        onCloseModal: closeSettings,
        onNavigate: navigateTo,
    }), [handleSubmit, navigateTo, closeSettings]);

    useKeyboardShortcuts(shortcutActions);

    // Show suggestion chips when: home, no task text, not loading, no result
    const showSuggestions = activeSection === 'home' && !task.trim() && !isLoading && !result;

    return (
        <AuroraBackground className="flex flex-col">
            <GlassNavigation
                activeSection={activeSection}
                onNavigate={navigateTo}
                toggleTheme={toggleTheme}
            />

            <main className="relative z-10 flex-1 container mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-8 md:pb-12 flex flex-col items-center justify-start min-h-screen max-w-6xl">

                {/* Main Content Card */}
                <CrystalCard
                    className="w-full min-h-[70vh] md:min-h-[80vh] flex flex-col"
                    variant="default"
                    hoverEffect="none"
                >
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeSection === 'home' && (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="space-y-10"
                                >
                                    {/* Hero Section */}
                                    <div className="text-center space-y-3 mb-6 pt-4 md:pt-8">
                                        <h1 className="text-3xl md:text-[40px] font-bold tracking-tight text-foreground leading-tight">
                                            {t('dashboard.title')}
                                        </h1>
                                        <p className="text-[16px] md:text-[17px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
                                            {t('dashboard.subtitle')}
                                        </p>
                                    </div>

                                    <TaskInput
                                        task={task}
                                        onTaskChange={setTask}
                                        onSubmit={handleSubmit}
                                        isLoading={isLoading}
                                        config={config}
                                        onStop={stopTask}
                                        ref={inputRef}
                                    />

                                    {/* Suggestion Chips — Empty State */}
                                    <AnimatePresence>
                                        {showSuggestions && (
                                            <SuggestionChips
                                                onSelect={handleSuggestionSelect}
                                                visible={showSuggestions}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Progress Bar — During Loading */}
                                    <AnimatePresence>
                                        {isLoading && loadingStage && (
                                            <ProgressBar
                                                currentStage={loadingStage}
                                                isVisible={isLoading}
                                            />
                                        )}
                                    </AnimatePresence>

                                    <LoadingOverlay
                                        isVisible={isLoading}
                                        stage={loadingStage}
                                        currentModel={currentModel}
                                        recentLogs={recentLogs}
                                    />
                                    <ErrorMessage message={error} />

                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.4 }}
                                            className="space-y-10 pb-16 pt-6"
                                        >
                                            <PlanDisplay plan={result.plan} />
                                            <div className="w-full h-px bg-border" />
                                            {result.reasoning_modes && result.reasoning_modes.length > 0 && (
                                                <>
                                                    <ReasoningModesDisplay modes={result.reasoning_modes} />
                                                    <div className="w-full h-px bg-border" />
                                                </>
                                            )}
                                            <SolutionDisplay output={result.final_output} h2Score={result.critic_score} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {activeSection === 'prompts' && (
                                <motion.div
                                    key="prompts"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <PromptsManager onSelect={handleSelectPrompt} />
                                </motion.div>
                            )}

                            {activeSection === 'history' && (
                                <HistoryDisplay />
                            )}

                            {activeSection === 'help' && (
                                <HelpDisplay isVisible={true} />
                            )}
                        </AnimatePresence>
                    </div>
                </CrystalCard>

            </main>

            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={closeSettings}
                onConfigChange={setConfig}
                settings={config}
            />

            {/* Onboarding Tour — first-time users */}
            <OnboardingTour />
        </AuroraBackground>
    );
};

export const AutoLogicLiquidInterface: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <ToastProvider>
                <AutoLogicLiquidContent />
            </ToastProvider>
        </ThemeProvider>
    );
};
