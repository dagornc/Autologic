/**
 * Sidebar Navigation Component - Style OpenAI
 * 
 * Panneau latéral gauche fixe avec icônes de navigation
 * et design glassmorphism premium.
 */

import React from 'react';
import { motion } from 'framer-motion';
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
            initial={{ width: 64 }}
            animate={{ width: isExpanded ? 200 : 64 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-full z-40 flex flex-col"
        >
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border-r border-white/10" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full py-4">

                {/* Logo / Brand */}
                <div className="px-3 mb-6">
                    <motion.div
                        className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm font-semibold text-white truncate"
                            >
                                AutoLogic
                            </motion.span>
                        )}
                    </motion.div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 px-2 space-y-1">
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

                {/* Divider */}
                <div className="mx-3 my-2 h-px bg-white/10" />

                {/* Bottom Navigation */}
                <div className="px-2 space-y-1">
                    {bottomItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isExpanded={isExpanded}
                            isActive={activeSection === item.id}
                            onClick={() => onNavigate(item.id)}
                        />
                    ))}
                </div>

                {/* Toggle Button */}
                <div className="px-2 mt-2">
                    <motion.button
                        onClick={onToggle}
                        className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-zinc-400 hover:text-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-xs">Réduire</span>
                            </>
                        ) : (
                            <ChevronRight className="w-4 h-4" />
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
                w-full p-2.5 rounded-xl flex items-center gap-3 transition-all group relative
                ${isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 border border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                    : 'hover:bg-white/5 border border-transparent hover:border-white/10 text-zinc-400 hover:text-white'
                }
            `}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Icon */}
            <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${isActive
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-white/5 group-hover:bg-white/10 text-zinc-500 group-hover:text-zinc-300'
                }
            `}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Label */}
            {isExpanded && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-medium truncate"
                >
                    {item.label}
                </motion.span>
            )}

            {/* Tooltip (when collapsed) */}
            {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.tooltip}
                </div>
            )}

            {/* Active Indicator */}
            {isActive && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                />
            )}
        </motion.button>
    );
};

export default Sidebar;
