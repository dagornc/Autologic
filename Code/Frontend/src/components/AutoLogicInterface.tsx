/**
 * Interface principale AutoLogic - Version refactorisée
 * Orchestre les composants atomiques
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Settings } from 'lucide-react';

import { ThemeProvider } from './ThemeProvider';
import SettingsDrawer from './SettingsDrawer';
import {
    TaskInput,
    LoadingOverlay,
    ErrorMessage,
    PlanDisplay,
    SolutionDisplay,
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

    return (
        <div className="min-h-screen w-full bg-[#0a0a0f] dark:bg-[#0a0a0f] bg-slate-50 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative transition-colors duration-300">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"
                    style={{ animationDuration: '4s' }}
                />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] mix-blend-screen" />
                <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">
                {/* Header */}
                <motion.header
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="text-center md:text-left space-y-2">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 border-slate-200 shadow-[0_0_30px_rgba(79,70,229,0.15)] hover:bg-white/10 transition-colors">
                            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm font-medium tracking-wider text-indigo-900 dark:text-indigo-100 uppercase">
                                System Ready
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 dark:from-white dark:via-indigo-100 dark:to-indigo-400 drop-shadow-sm mt-4">
                            AutoLogic Framework
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 hover:bg-white/10 transition-colors group"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </motion.header>

                {/* Settings Drawer */}
                <SettingsDrawer
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onConfigChange={setConfig}
                />

                {/* Task Input */}
                <TaskInput
                    task={task}
                    onTaskChange={setTask}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    config={config}
                />

                {/* Loading State */}
                <LoadingOverlay isVisible={isLoading} stage={loadingStage} />

                {/* Error Message */}
                <ErrorMessage message={error} />

                {/* Results Section */}
                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="space-y-8"
                        >
                            {/* Plan Section */}
                            <PlanDisplay plan={result.plan} />

                            {/* Divider */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                            {/* Final Output Section */}
                            <SolutionDisplay output={result.final_output} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
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
