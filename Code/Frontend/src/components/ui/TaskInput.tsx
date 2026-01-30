/**
 * Composant de saisie de tâche avec design Premium Glass
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowUp, X } from 'lucide-react';
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
            className="w-full max-w-3xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow Behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

                {/* Main Input Container */}
                <div className="relative glass-panel rounded-2xl p-2 flex items-end gap-2 transition-all duration-300 ring-1 ring-white/10 group-focus-within:ring-indigo-500/50">

                    {/* Text Area / Input */}
                    <div className="flex-1 min-h-[56px] relative">
                        <textarea
                            value={task}
                            onChange={(e) => onTaskChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (task.trim() && !isLoading) onSubmit();
                                }
                            }}
                            placeholder="Describe a complex problem to solve..."
                            className="w-full h-full min-h-[56px] max-h-[200px] bg-transparent text-lg px-4 py-3.5 text-black dark:text-slate-100 placeholder:text-zinc-500 dark:placeholder:text-slate-500 focus:outline-none resize-none align-bottom overflow-hidden leading-relaxed"
                            style={{ height: 'auto', fieldSizing: 'content' } as React.CSSProperties & { fieldSizing?: string }}
                        />
                        {/* Fallback for field-sizing if not supported widely yet, but chrome supports it. Alternatively use auto-resize hook. For now simple textarea. */}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pb-1">
                        {task && (
                            <button
                                type="button"
                                onClick={() => onTaskChange('')}
                                className="p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !task.trim()}
                        className={cn(
                            'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5',
                            isLoading || !task.trim()
                                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ArrowUp className="w-6 h-6" />
                        )}
                    </button>
                </div>

                {/* Footer / Config Info */}
                <div className="absolute top-full left-0 right-0 mt-3 flex justify-center opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 delay-100">
                    {(config?.provider || config?.model) ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300 backdrop-blur-md">
                            <Sparkles className="w-3 h-3" />
                            <span className="font-semibold">{config.provider}</span>
                            <span className="opacity-50">/</span>
                            <span>{config.model}</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 backdrop-blur-md">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Reasoning Engine Ready</span>
                        </div>
                    )}
                </div>
            </form>
        </motion.div>
    );
};
