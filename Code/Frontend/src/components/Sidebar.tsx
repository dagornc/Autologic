/**
 * Sidebar Navigation Component - Premium Glassmorphism
 * 
 * Panneau latéral gauche avec effets de verre liquide et animations fluides.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Settings,
    History,
    Sparkles,
    FileText,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';

interface SidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    onNavigate: (section: string) => void;
    activeSection: string;
}

interface NavItem {
    id: string;
    icon: React.ElementType;
    label: string;
    tooltip: string;
}

const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', tooltip: 'Accueil' },
    { id: 'settings', icon: Settings, label: 'Settings', tooltip: 'Paramètres LLM' },
    { id: 'history', icon: History, label: 'History', tooltip: 'Historique' },
    { id: 'prompts', icon: FileText, label: 'Prompts', tooltip: 'Gestion Prompts' },
];

const bottomItems: NavItem[] = [
    { id: 'help', icon: HelpCircle, label: 'Help', tooltip: 'Aide' },
];

const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    onToggle,
    onNavigate,
    activeSection
}) => {
    return (
        <motion.aside
            initial={{ width: 80 }}
            animate={{ width: isExpanded ? 240 : 80 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-4 top-4 bottom-4 z-50 rounded-2xl glass-panel flex flex-col overflow-hidden"
        >
            {/* Liquid Background subtle effect inside the sidebar */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full py-6 px-3">

                {/* Logo / Brand */}
                <div className="mb-8 px-1">
                    <motion.div
                        className="flex items-center gap-3 p-2 rounded-xl group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onNavigate('home')}
                    >
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur shadow-lg shadow-indigo-500/40" />
                            <div className="relative w-full h-full bg-white dark:bg-black rounded-xl border border-black/5 dark:border-white/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-col overflow-hidden"
                                >
                                    <span className="text-lg font-bold text-foreground tracking-wide">AutoLogic</span>
                                    <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Agentic AI</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isExpanded={isExpanded}
                            isActive={activeSection === item.id}
                            onClick={() => onNavigate(item.id)}
                        />
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="space-y-2 pt-4 border-t border-black/5 dark:border-white/5">
                    {bottomItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isExpanded={isExpanded}
                            isActive={activeSection === item.id}
                            onClick={() => onNavigate(item.id)}
                        />
                    ))}

                    {/* Theme Toggle */}
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-1"
                        >
                            <ThemeToggle />
                        </motion.div>
                    )}

                    {/* Toggle Button */}
                    <motion.button
                        onClick={onToggle}
                        className="w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-foreground dark:hover:text-white mt-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isExpanded ? (
                            <div className="flex items-center gap-2">
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Collapse</span>
                            </div>
                        ) : (
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.aside>
    );
};

/**
 * Navigation Button Component
 */
interface NavButtonProps {
    item: NavItem;
    isExpanded: boolean;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
    item,
    isExpanded,
    isActive,
    onClick
}) => {
    const Icon = item.icon;

    return (
        <motion.button
            onClick={onClick}
            className={`
                relative w-full p-3 rounded-xl flex items-center gap-4 transition-all duration-300 group
                ${isActive
                    ? 'text-indigo-500 font-semibold dark:text-white bg-indigo-50/50 dark:bg-white/10'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/30 dark:hover:bg-white/5'
                }
            `}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Active Background Glow */}
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex items-center justify-center w-6 h-6`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} />
            </div>

            {/* Label */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: 0.1 }}
                        className="relative z-10 text-sm font-medium whitespace-nowrap"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Active Side Indicator (optional, removed for cleaner look, relying on background glow) */}
        </motion.button>
    );
};

export default Sidebar;
