/**
 * Composant Header avec status et boutons
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Settings } from 'lucide-react';

interface HeaderProps {
    onSettingsClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
    return (
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
                    onClick={onSettingsClick}
                    className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 hover:bg-white/10 transition-colors group"
                    title="Settings"
                >
                    <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>
            </div>
        </motion.header>
    );
};
