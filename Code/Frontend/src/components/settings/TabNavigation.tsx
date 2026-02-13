/**
 * Apple HIG Settings Tab Navigation — Multilingual
 *
 * Desktop: Sidebar list with icons (macOS System Settings style)
 * Mobile: Segmented control (iOS UISegmentedControl style)
 *
 * All labels internationalized via react-i18next.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Sliders, Cpu, Bot, ShieldCheck } from 'lucide-react';

export type TabId = 'general' | 'strategic' | 'tactical' | 'audit';

interface TabNavigationProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const TAB_META: { id: TabId; i18nKey: string; icon: React.ElementType; color: string }[] = [
    { id: 'general', i18nKey: 'settings.tabs.general', icon: Sliders, color: '#8E8E93' },
    { id: 'strategic', i18nKey: 'settings.tabs.strategic', icon: Cpu, color: '#007AFF' },
    { id: 'tactical', i18nKey: 'settings.tabs.tactical', icon: Bot, color: '#34C759' },
    { id: 'audit', i18nKey: 'settings.tabs.audit', icon: ShieldCheck, color: '#FF9500' },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Desktop: Sidebar list */}
            <nav className="hidden md:flex flex-col gap-1" role="tablist">
                {TAB_META.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl text-left text-[15px] font-medium transition-all duration-200 outline-none",
                                isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="settings-tab-indicator"
                                    className="absolute inset-0 bg-card rounded-xl shadow-apple-sm border border-border"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-3">
                                <span
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${tab.color}20` }}
                                >
                                    <Icon
                                        size={16}
                                        style={{ color: tab.color }}
                                    />
                                </span>
                                {t(tab.i18nKey)}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Mobile: Segmented control */}
            <div className="flex md:hidden p-1 bg-card rounded-xl border border-border" role="tablist">
                {TAB_META.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[36px] text-[13px] font-medium transition-colors duration-200 z-10 outline-none rounded-lg",
                                isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="settings-segment-indicator"
                                    className="absolute inset-0 bg-background rounded-lg shadow-apple-sm"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <Icon size={14} style={{ color: isActive ? tab.color : undefined }} />
                                <span className="hidden xs:inline">{t(tab.i18nKey)}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default TabNavigation;
