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

/**
 * Contenu principal de l'application
 */
const AutoLogicContent: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [config, setConfig] = useState<LLMConfig>({ provider: '', model: '' });

    const {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        submitTask,
    } = useAutoLogic();

    const handleSubmit = () => {
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
        <div className="min-h-screen w-full bg-background text-foreground font-sans selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-200 overflow-x-hidden relative">

            {/* Ambient Liquid Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-[flow_15s_infinite_alternate]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-[flow_20s_infinite_alternate-reverse]" />
                <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full mix-blend-overlay filter blur-[80px] opacity-20 animate-[pulse_8s_infinite]" />
            </div>

            {/* Sidebar */}
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
                onNavigate={handleNavigate}
                activeSection={activeSection}
            />

            {/* Main Content Area */}
            <main
                className={`relative z-10 transition-all duration-300 min-h-screen flex flex-col ${isSidebarExpanded ? 'pl-[260px]' : 'pl-[100px]'
                    }`}
            >
                {/* Main Glass Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-5xl w-full mx-auto my-8 bg-white/60 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden min-h-[85vh] flex flex-col relative"
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
                                        config={config}
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

            {/* Settings Drawer */}
            <SettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onConfigChange={setConfig}
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
