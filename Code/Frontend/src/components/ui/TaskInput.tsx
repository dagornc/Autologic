/**
 * Apple-style Task Input Component
 * 
 * Clean pill-shaped textarea inspired by Apple Intelligence search bar.
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Square, RefreshCw } from 'lucide-react';
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

export const TaskInput = forwardRef<HTMLTextAreaElement, TaskInputProps>((
    {
        task,
        onTaskChange,
        onSubmit,
        isLoading,
        config,
        onStop,
    },
    ref,
) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-4xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="relative group">
                {/* Subtle focus ring glow */}
                <div className="absolute -inset-1 bg-primary/8 rounded-[30px] blur-xl transition-opacity duration-500 opacity-0 group-focus-within:opacity-100" />

                {/* Main Input Container */}
                <div className="relative bg-card rounded-[24px] p-2 flex items-end gap-3 transition-all duration-300 border border-border group-focus-within:border-primary/30 shadow-apple-md group-focus-within:shadow-apple-lg">

                    {/* Text Area */}
                    <div className="flex-1 min-h-[56px] relative py-1.5">
                        <textarea
                            ref={ref}
                            value={task}
                            onChange={(e) => onTaskChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (task.trim() && !isLoading) onSubmit();
                                }
                            }}
                            placeholder="Describe a complex problem to solve with AutoLogic..."
                            className="w-full h-full min-h-[56px] max-h-[400px] bg-transparent text-[17px] px-4 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none overflow-hidden font-normal leading-relaxed"
                            style={{ height: 'auto', fieldSizing: 'content' } as React.CSSProperties & { fieldSizing?: string }}
                        />
                    </div>

                    {/* Submit / Stop Button */}
                    <div className="pb-1.5 pr-1">
                        {isLoading && onStop ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
                                title="Stop Treatment"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Square className="w-4 h-4 fill-destructive" />
                                </motion.div>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isLoading || !task.trim()}
                                className={cn(
                                    'h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200',
                                    isLoading || !task.trim()
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-apple-sm hover:shadow-apple-md active:scale-95'
                                )}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <ArrowUp className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-3 flex items-center justify-between px-4 opacity-60 group-focus-within:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isLoading ? "bg-destructive animate-pulse" : "bg-apple-green"
                            )} />
                            <span className={cn(
                                "text-[12px] font-medium tracking-wide",
                                isLoading ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {isLoading ? "Processing" : "Ready"}
                            </span>
                        </div>
                        {(config?.provider) && (
                            <span className="text-[12px] font-medium text-muted-foreground">
                                {config.provider} · {config.model}
                            </span>
                        )}
                    </div>
                    <span className="text-[12px] font-medium hidden sm:block text-muted-foreground">
                        Press <kbd className="px-1.5 py-0.5 rounded-md border border-border bg-muted/50 mx-0.5 font-mono text-[11px] text-foreground">⏎</kbd> to solve
                    </span>
                </div>
            </form>
        </motion.div>
    );
});

TaskInput.displayName = 'TaskInput';
