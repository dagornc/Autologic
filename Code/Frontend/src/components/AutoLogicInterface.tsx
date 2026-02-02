/**
 * Interface principale AutoLogic - Premium Layout
 * Orchestre les composants avec layout liquide et glassmorphism.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import Sidebar from './Sidebar';
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
    Header,

} from './ui';
import { useAutoLogic } from '../hooks/useAutoLogic';
import type { LLMConfig } from '../types';

/** Variants d'animation pour le conteneur */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { usePersistedSettings } from '../hooks/useSettings';

/**
 * Contenu principal de l'application
 */
const AutoLogicContent: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [settings, setSettings] = usePersistedSettings(DEFAULT_SETTINGS);

    const {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        submitTask,
        stopTask,
    } = useAutoLogic();

    const handleSubmit = () => {
        // Map settings to LLMConfig for the root agent
        const config: LLMConfig = {
            provider: settings.provider,
            model: settings.model,
            apiKey: settings.apiKey,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            topP: settings.topP,
            timeout: settings.timeout,
            auditMaxRetries: settings.auditMaxRetries,
            retryEnabled: settings.retryEnabled,
            fallbackEnabled: settings.fallbackEnabled,
            rateLimit: settings.rateLimit,
        };
        submitTask(config);
    };

    const handleNavigate = (section: string) => {
        setActiveSection(section);
        if (section === 'settings') {
            setIsSettingsOpen(true);
        }
    };

    const handleSelectPrompt = (content: string) => {
        setTask(content);
        setActiveSection('home');
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan overflow-x-hidden relative">

            {/* Noise Texture Layer */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-[1]" />

            {/* Ambient Liquid Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-flow bg-neon-cyan/30" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-flow-reverse bg-neon-magenta/30" />
                <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full mix-blend-overlay filter blur-[80px] opacity-10 animate-pulse-slow bg-neon-cyan/20" />
            </div>

            {/* Main Content Area */}
            <main
                className={`relative z-10 transition-all duration-500 min-h-screen flex flex-col ${isSidebarExpanded ? 'pl-[260px]' : 'pl-[100px]'
                    }`}
            >
                {/* Main Glass Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-5xl w-full mx-auto my-8 bg-white/[0.02] backdrop-blur-3xl rounded-[32px] overflow-hidden min-h-[85vh] flex flex-col relative border border-white/10 shadow-modal"
                >
                    {/* Interior Scroll Container */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">

                        <AnimatePresence mode="wait">
                            {activeSection === 'home' && (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-12"
                                >
                                    <Header
                                        status={
                                            isLoading ? 'loading' : error ? 'error' : 'idle'
                                        }
                                    />

                                    <TaskInput
                                        task={task}
                                        onTaskChange={setTask}
                                        onSubmit={handleSubmit}
                                        isLoading={isLoading}
                                        config={{
                                            provider: settings.provider,
                                            model: settings.model,
                                            apiKey: settings.apiKey,
                                            temperature: settings.temperature,
                                            maxTokens: settings.maxTokens,
                                            topP: settings.topP,
                                            timeout: settings.timeout,
                                            auditMaxRetries: settings.auditMaxRetries,
                                            retryEnabled: settings.retryEnabled,
                                            fallbackEnabled: settings.fallbackEnabled,
                                            rateLimit: settings.rateLimit,
                                        }}
                                        onStop={stopTask}
                                    />

                                    <LoadingOverlay isVisible={isLoading} stage={loadingStage} />

                                    <ErrorMessage message={error} />

                                    {result && (
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="hidden"
                                            className="space-y-12 pb-20"
                                        >
                                            <PlanDisplay plan={result.plan} />
                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" />
                                            <SolutionDisplay output={result.final_output} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {activeSection === 'prompts' && (
                                <motion.div
                                    key="prompts"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
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
                </motion.div>
            </main>

            {/* Sidebar Navigation */}
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                onNavigate={handleNavigate}
                activeSection={activeSection}
            />

            {/* Settings Drawer */}
            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onConfigChange={setSettings}
                settings={settings}
            />
        </div>
    );
};

/**
 * Composant racine avec ThemeProvider
 */
const AutoLogicInterface: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AutoLogicContent />
        </ThemeProvider>
    );
};

export default AutoLogicInterface;
