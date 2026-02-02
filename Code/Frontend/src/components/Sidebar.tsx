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
            className="fixed left-6 top-6 bottom-6 z-50 rounded-[28px] bg-white/[0.03] backdrop-blur-3xl flex flex-col overflow-hidden border border-white/10 shadow-modal"
        >
            {/* Noise Texture Layer */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full py-8 px-4">

                {/* Logo / Brand */}
                <div className="mb-10 px-1">
                    <motion.div
                        className="flex items-center gap-3 p-2 rounded-2xl group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onNavigate('home')}
                    >
                        <div className="relative w-11 h-11 flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-2xl blur-[8px] opacity-40 group-hover:opacity-70 transition-opacity" />
                            <div className="relative w-full h-full bg-background rounded-2xl border border-white/20 flex items-center justify-center shadow-lg">
                                <Sparkles className="w-5 h-5 text-neon-cyan group-hover:scale-110 transition-transform" />
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
                                    <span className="text-[18px] font-bold text-white tracking-tight">AutoLogic</span>
                                    <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest">v3.0 Stable</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 space-y-3">
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
                <div className="space-y-3 pt-6 border-t border-white/5">
                    {bottomItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isExpanded={isExpanded}
                            isActive={activeSection === item.id}
                            onClick={() => onNavigate(item.id)}
                        />
                    ))}

                    {/* Theme Toggle placeholder (ThemeToggle handles its own glass) */}
                    {isExpanded && (
                        <div className="px-1 py-1">
                            <ThemeToggle />
                        </div>
                    )}

                    {/* Toggle Button */}
                    <motion.button
                        onClick={onToggle}
                        className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all group flex items-center justify-center text-white/60 hover:text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isExpanded ? (
                            <div className="flex items-center gap-2">
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-[13px] font-semibold">Collapse</span>
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
                relative w-full p-3.5 rounded-2xl flex items-center gap-4 transition-all duration-300 group
                ${isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }
            `}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Active Background Glow */}
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-2xl shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            {/* Active Indicator Line */}
            {isActive && (
                <motion.div
                    layoutId="activeSideLine"
                    className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-[4px] h-[20px] bg-neon-cyan rounded-full shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}

            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center w-6 h-6">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-neon-cyan' : 'group-hover:text-neon-cyan/70'}`} />
            </div>

            {/* Label */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: 0.1 }}
                        className="relative z-10 text-[14px] font-medium whitespace-nowrap"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default Sidebar;
