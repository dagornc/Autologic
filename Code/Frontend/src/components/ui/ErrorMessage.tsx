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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4 text-red-800 dark:text-red-200 backdrop-blur-md"
                >
                    <AlertCircle className="w-6 h-6 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">
                            Process Failed
                        </h3>
                        <p className="text-sm opacity-90">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
