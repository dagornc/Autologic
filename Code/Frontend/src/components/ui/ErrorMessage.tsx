/**
 * Composant d'affichage des messages d'erreur
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative overflow-hidden rounded-2xl bg-card border border-neon-magenta/30 p-6 flex items-start gap-5 backdrop-blur-3xl shadow-modal"
                >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-neon-magenta/5 pointer-events-none" />

                    <div className="relative shrink-0">
                        <AlertCircle className="w-7 h-7 text-neon-magenta" />
                        <div className="absolute inset-0 bg-neon-magenta/20 blur-lg rounded-full animate-pulse" />
                    </div>

                    <div className="relative z-10 flex-1">
                        <h3 className="text-sm font-bold text-neon-magenta uppercase tracking-[0.2em] mb-2 font-mono">
                            Execution_Halted
                        </h3>
                        <p className="text-foreground/90 text-[15px] leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-20 text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                        <span>ERR_001</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

