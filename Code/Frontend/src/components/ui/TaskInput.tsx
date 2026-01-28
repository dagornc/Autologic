/**
 * Composant de saisie de tâche avec bouton de soumission
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LLMConfig } from '../../types';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface TaskInputProps {
    task: string;
    onTaskChange: (task: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    config?: LLMConfig;
}

export const TaskInput: React.FC<TaskInputProps> = ({
    task,
    onTaskChange,
    onSubmit,
    isLoading,
    config,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative group perspective-1000"
        >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

            {/* Input container */}
            <div className="relative p-1 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 ring-1 ring-slate-900/5 dark:ring-white/5 shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 p-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={task}
                            onChange={(e) => onTaskChange(e.target.value)}
                            placeholder="Describe a complex problem to solve..."
                            className="w-full h-14 bg-transparent text-lg px-6 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none"
                        />
                        {task && (
                            <button
                                type="button"
                                onClick={() => onTaskChange('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <div className="bg-slate-200 dark:bg-white/10 rounded-full p-1">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </div>
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !task.trim()}
                        className={cn(
                            'h-14 px-8 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-2 shadow-lg',
                            isLoading
                                ? 'bg-indigo-600/50 cursor-not-allowed text-indigo-200'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing</span>
                            </>
                        ) : (
                            <>
                                <span>Start Reasoning</span>
                                <Sparkles className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Active Configuration Display */}
            {(config?.provider || config?.model) && (
                <div className="mt-2 flex justify-end">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-300">
                        <span className="font-semibold">{config.provider || 'Default'}</span>
                        {config.model && (
                            <>
                                <span className="opacity-50">/</span>
                                <span>{config.model}</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
