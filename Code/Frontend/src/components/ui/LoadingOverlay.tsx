/**
 * Composant d'overlay de chargement avec animation des stages
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import type { LoadingStage } from '../../types';

interface LoadingOverlayProps {
    isVisible: boolean;
    stage: LoadingStage;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, stage }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-center"
                >
                    <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                        <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <span className="text-indigo-800 dark:text-indigo-200 font-mono text-sm tracking-wide">
                            {stage}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
