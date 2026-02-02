import React, { useState } from 'react';
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
} from './ui';
import { AuroraBackground } from './ui/liquid/AuroraBackground';
import { GlassNavigation } from './ui/liquid/GlassNavigation';
import { CrystalCard } from './ui/liquid/CrystalCard';
import { useTheme } from '../hooks/useTheme';
import { usePersistedSettings } from '../hooks/useSettings';
import { useAutoLogic } from '../hooks/useAutoLogic';
import type { LLMConfig } from '../types';
import type { SettingsConfig } from '../types/settings';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';


const AutoLogicLiquidContent: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [config, setConfig] = usePersistedSettings(DEFAULT_SETTINGS);

    const {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        currentModel,
        submitTask,
        stopTask,
    } = useAutoLogic();

    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleSubmit = () => {
        submitTask(config);
    };

    const handleNavigate = (section: string) => {
        if (section === 'settings') {
            setIsSettingsOpen(true);
        } else {
            setActiveSection(section);
        }
    };

    const handleSelectPrompt = (content: string) => {
        setTask(content);
        setActiveSection('home');
    };

    return (
        <AuroraBackground className="flex flex-col">
            <GlassNavigation
                activeSection={activeSection}
                onNavigate={handleNavigate}
                toggleTheme={toggleTheme}
            />

            <main className="relative z-10 flex-1 container mx-auto px-4 pt-24 pb-12 flex flex-col items-center justify-start min-h-screen">

                {/* Main Content Card */}
                <CrystalCard
                    className="w-full max-w-6xl min-h-[80vh] flex flex-col shadow-2xl"
                    variant="default"
                    hoverEffect="none"
                >
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeSection === 'home' && (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-12"
                                >
                                    <div className="text-center space-y-2 mb-8">
                                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-slate-100 dark:to-slate-400">
                                            What will we solve today?
                                        </h1>
                                        <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
                                            Orchestrating autonomous agents to solve complex reasoning tasks.
                                        </p>
                                    </div>

                                    <TaskInput
                                        task={task}
                                        onTaskChange={setTask}
                                        onSubmit={handleSubmit}
                                        isLoading={isLoading}
                                        config={config}
                                        onStop={stopTask}
                                    />

                                    <LoadingOverlay
                                        isVisible={isLoading}
                                        stage={loadingStage}
                                        currentModel={currentModel}
                                    />
                                    <ErrorMessage message={error} />

                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-12 pb-20 pt-8"
                                        >
                                            <PlanDisplay plan={result.plan} />
                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            {result.reasoning_modes && result.reasoning_modes.length > 0 && (
                                                <>
                                                    <ReasoningModesDisplay modes={result.reasoning_modes} />
                                                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
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
                onClose={() => setIsSettingsOpen(false)}
                onConfigChange={setConfig}
                settings={config}
            />
        </AuroraBackground>
    );
};

export const AutoLogicLiquidInterface: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AutoLogicLiquidContent />
        </ThemeProvider>
    );
};
