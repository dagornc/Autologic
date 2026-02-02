/**
 * Composant de saisie de tâche avec design Premium Glass
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUp, Square, RefreshCw } from 'lucide-react';
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
    onStop?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({
    task,
    onTaskChange,
    onSubmit,
    isLoading,
    config,
    onStop,
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
            className="w-full max-w-4xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow Behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 rounded-3xl blur-2xl transition-opacity duration-500 opacity-0 group-focus-within:opacity-100" />

                {/* Main Input Container */}
                <div className="relative bg-background/80 backdrop-blur-2xl rounded-[28px] p-2 flex items-end gap-3 transition-all duration-500 border border-border group-focus-within:border-neon-cyan/50 shadow-2xl">

                    {/* Text Area / Input */}
                    <div className="flex-1 min-h-[64px] relative py-2">
                        <textarea
                            value={task}
                            onChange={(e) => onTaskChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (task.trim() && !isLoading) onSubmit();
                                }
                            }}
                            placeholder="Describe a complex problem to solve with AutoLogic..."
                            className="w-full h-full min-h-[64px] max-h-[400px] bg-transparent text-[17px] px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none align-bottom overflow-hidden font-medium custom-scrollbar leading-relaxed"
                            style={{ height: 'auto', fieldSizing: 'content' } as React.CSSProperties & { fieldSizing?: string }}
                        />
                    </div>

                    {/* Submit / Stop Button */}
                    <div className="pb-1 pr-1">
                        {isLoading && onStop ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="h-14 min-w-[56px] px-4 rounded-2xl flex items-center justify-center transition-all duration-300 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                title="Stop Treatment"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Square className="w-5 h-5 fill-red-500" />
                                </motion.div>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isLoading || !task.trim()}
                                className={cn(
                                    'h-14 min-w-[56px] px-4 rounded-2xl flex items-center justify-center transition-all duration-500',
                                    isLoading || !task.trim()
                                        ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                                        : 'bg-white text-black hover:bg-neon-cyan hover:text-black shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] group/btn'
                                )}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold uppercase tracking-wider ml-1 hidden sm:block">Solve</span>
                                        <ArrowUp className="w-6 h-6 group-hover/btn:-translate-y-1 transition-transform" />
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 flex items-center justify-between px-6 opacity-70 group-focus-within:opacity-100 transition-opacity duration-500 font-mono">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                isLoading ? "bg-red-500" : "bg-neon-cyan"
                            )} />
                            <span className={cn(
                                "text-[10px] font-bold tracking-widest uppercase",
                                isLoading ? "text-red-500" : "text-neon-cyan"
                            )}>
                                {isLoading ? "Processing" : "Ready"}
                            </span>
                        </div>
                        {(config?.provider) && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-neon-cyan">
                                <Sparkles className="w-3 h-3" />
                                <span>{config.provider} : {config.model}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary/50 mx-1 font-sans text-foreground">Enter</kbd> to solve</span>
                </div>
            </form>
        </motion.div>
    );
};

