/**
 * Apple-style Error Message Component
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="rounded-2xl bg-apple-red/5 border border-apple-red/15 p-5 flex items-start gap-4 shadow-apple-sm"
                >
                    <AlertCircle className="w-6 h-6 text-apple-red shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <h3 className="text-[13px] font-semibold text-apple-red uppercase tracking-wider mb-1.5">
                            Error
                        </h3>
                        <p className="text-foreground/90 text-[15px] leading-relaxed">
                            {message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
