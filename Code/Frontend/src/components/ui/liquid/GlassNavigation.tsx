import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidButton } from './LiquidButton';
import { Menu, X, Sun, Moon } from 'lucide-react';

interface GlassNavigationProps {
    activeSection: string;
    onNavigate: (section: string) => void;
    toggleTheme: () => void;
}

export const GlassNavigation: React.FC<GlassNavigationProps> = ({ activeSection, onNavigate, toggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
      { id: 'home', label: 'Dashboard' },
      { id: 'prompts', label: 'Prompts' },
      { id: 'history', label: 'History' },
      { id: 'help', label: 'Help' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? 'h-16 bg-glass-bg/80 backdrop-blur-xl border-glass-border shadow-glass-sm' 
            : 'h-20 bg-transparent border-transparent'
        }`}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo Area */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-neon-violet flex items-center justify-center text-white font-bold shadow-neon-cyan">
                A
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              AutoLogic
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-all duration-300 hover:text-glow ${
                    activeSection === item.id 
                    ? 'text-primary scale-105' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
                onClick={toggleTheme}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-foreground/80"
            >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </button>
            <LiquidButton size="sm" variant="primary" onClick={() => onNavigate('settings')}>
              Settings
            </LiquidButton>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl md:hidden pt-24 px-6"
          >
             <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <button 
                    key={item.id} 
                    className={`text-2xl font-light text-left border-b border-white/5 pb-4 ${
                        activeSection === item.id ? 'text-primary' : 'text-foreground/90'
                    }`}
                    onClick={() => {
                        onNavigate(item.id);
                        setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                <LiquidButton className="w-full mt-4" onClick={() => {
                    onNavigate('settings');
                    setIsMobileMenuOpen(false);
                }}>Settings</LiquidButton>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

