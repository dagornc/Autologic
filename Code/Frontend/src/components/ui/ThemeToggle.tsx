/**
 * Apple-style Theme Toggle
 */

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
            className="relative p-2.5 rounded-full hover:bg-muted/50 transition-colors duration-200"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -12, opacity: 0, rotate: -60 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 12, opacity: 0, rotate: 60 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {isDark ? (
                        <Moon className="w-[18px] h-[18px] text-muted-foreground" />
                    ) : (
                        <Sun className="w-[18px] h-[18px] text-muted-foreground" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
};
