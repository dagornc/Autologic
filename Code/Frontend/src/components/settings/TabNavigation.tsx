import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sliders, Cpu, Bot, ShieldCheck } from 'lucide-react';

export type TabId = 'general' | 'strategic' | 'tactical' | 'audit';

interface TabNavigationProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'general', label: 'General', icon: Sliders, color: 'var(--color-general)' },
    { id: 'strategic', label: 'Strategic', icon: Cpu, color: 'var(--color-strategic)' },
    { id: 'tactical', label: 'Tactical', icon: Bot, color: 'var(--color-tactical)' },
    { id: 'audit', label: 'Audit', icon: ShieldCheck, color: 'var(--color-audit)' },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="relative flex p-2 bg-[var(--glass-1-bg)]/50 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-glass-1">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-300 z-10 outline-none rounded-xl",
                            isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {/* Liquid Indicator */}
                        {isActive && (
                            <motion.div
                                layoutId="liquid-indicator"
                                className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/20 to-white/5 shadow-glass-2 border border-white/10"
                                style={{
                                    backgroundColor: `color-mix(in oklch, ${tab.color}, transparent 80%)`,
                                    boxShadow: `0 0 20px ${tab.color.replace(')', ' / 0.3)')}`
                                }}
                                initial={false}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                            >
                                {/* The "Blob" Morphing Shape - internal decorative element for the liquid feel */}
                                <motion.div
                                    className="absolute inset-0 opacity-50"
                                    animate={{
                                        borderRadius: ["60% 40% 30% 70%/60% 30% 70% 40%", "30% 60% 70% 40%/50% 60% 30% 60%"],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        background: `radial-gradient(circle at 50% 50%, ${tab.color}, transparent 70%)`,
                                        filter: 'blur(8px)'
                                    }}
                                />
                            </motion.div>
                        )}

                        <span className="relative z-10 flex items-center gap-2">
                            <Icon
                                size={16}
                                className={cn("transition-colors", isActive && "text-white drop-shadow-md")}
                                style={{ color: isActive ? 'white' : undefined }}
                            />
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default TabNavigation;
