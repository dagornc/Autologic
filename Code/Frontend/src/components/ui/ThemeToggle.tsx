import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const isDark = theme === 'dark';

    return (
        <button
            onClick={cycleTheme}
            className="relative p-3 rounded-xl overflow-hidden group btn-ghost-liquid"
            aria-label="Toggle theme"
        >
            {/* Liquid Background Effect for Toggle */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={theme}
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {isDark ? (
                            <Moon className="w-5 h-5 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />
                        ) : (
                            <Sun className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 ring-1 ring-white/10 rounded-xl group-hover:ring-white/30 transition-all duration-300" />
        </button>
    );
};
