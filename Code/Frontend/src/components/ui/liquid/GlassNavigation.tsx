/**
 * Apple-style Frosted Glass Navigation — Multilingual
 *
 * Top navigation bar with frosted glass vibrancy,
 * centered nav links, language selector, and responsive mobile hamburger menu.
 * Conforms to Apple HIG 2025: 44pt touch targets, 16px spacing grid.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LiquidButton } from './LiquidButton';
import { LanguageSelector } from '../LanguageSelector';
import { Menu, X, Sun, Moon } from 'lucide-react';

interface GlassNavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  toggleTheme: () => void;
}

export const GlassNavigation: React.FC<GlassNavigationProps> = ({ activeSection, onNavigate, toggleTheme }) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t('nav.dashboard') },
    { id: 'prompts', label: t('nav.prompts') },
    { id: 'history', label: t('nav.history') },
    { id: 'help', label: t('nav.help') },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'h-14 md:h-16 bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-border shadow-apple-sm'
          : 'h-16 md:h-20 bg-transparent border-b border-transparent'
          }`}
      >
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between max-w-6xl">
          {/* Logo Area */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-apple-sm group-hover:shadow-apple-md transition-shadow duration-300">
              A
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              AutoLogic
            </span>
          </div>

          {/* Desktop Links — Apple HIG pill navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 min-h-[44px] ${activeSection === item.id
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions — Language Selector + Theme Toggle + Settings */}
          <div className="hidden md:flex items-center gap-1.5">
            <LanguageSelector />
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-full hover:bg-muted/50 transition-colors duration-300 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('common.theme.toggle')}
            >
              <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </button>
            <LiquidButton size="sm" variant="primary" onClick={() => onNavigate('settings')}>
              {t('nav.settings')}
            </LiquidButton>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2.5 rounded-full text-foreground hover:bg-muted/50 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl md:hidden"
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-full hover:bg-muted/50 transition-colors text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1 px-6 pt-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`text-left text-[28px] font-light py-4 border-b border-border/50 transition-colors min-h-[44px] ${activeSection === item.id ? 'text-primary' : 'text-foreground'
                    }`}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.label}
                </motion.button>
              ))}

              {/* Mobile actions: Language + Settings + Theme */}
              <div className="flex items-center gap-4 pt-8">
                <LanguageSelector />
                <LiquidButton
                  className="flex-1"
                  onClick={() => {
                    onNavigate('settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {t('nav.settings')}
                </LiquidButton>
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-full bg-muted/50 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('common.theme.toggle')}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
