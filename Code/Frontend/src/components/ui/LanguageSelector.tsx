/**
 * LanguageSelector — Apple HIG 2025 Popover
 *
 * Frosted glass dropdown with flag icons and checkmark on active language.
 * Follows Apple HIG: 44pt touch targets, 12px rounded popover, vibrancy.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLang = SUPPORTED_LANGUAGES.find(
        (lang) => lang.code === i18n.language
    ) ?? SUPPORTED_LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full
                           text-sm font-medium text-muted-foreground
                           hover:text-foreground hover:bg-muted/50
                           transition-all duration-300 min-h-[44px]"
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline text-[13px] tracking-tight">
                    {currentLang.code.toUpperCase()}
                </span>
                <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute right-0 top-full mt-2 z-[60]
                                   min-w-[180px] overflow-hidden
                                   rounded-xl border border-border
                                   bg-background/80 backdrop-blur-2xl backdrop-saturate-150
                                   shadow-lg shadow-black/20"
                    >
                        {/* Arrow indicator */}
                        <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45
                                        bg-background/80 border-l border-t border-border" />

                        <div className="py-1.5 relative">
                            {SUPPORTED_LANGUAGES.map((lang) => {
                                const isActive = lang.code === i18n.language;
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleSelect(lang.code)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5
                                                    text-sm font-medium transition-colors duration-150
                                                    min-h-[44px]
                                                    ${isActive
                                                ? 'text-primary bg-primary/8'
                                                : 'text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        <span className="text-lg leading-none">
                                            {lang.flag}
                                        </span>
                                        <span className="flex-1 text-left">
                                            {lang.label}
                                        </span>
                                        {isActive && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
