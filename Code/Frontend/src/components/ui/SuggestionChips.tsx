/**
 * Apple-style Suggestion Chips — Dashboard Empty State
 *
 * Displays clickable suggestion chips and quick-start cards
 * when the user has no active task. Follows Apple HIG 2025: 44pt targets,
 * glassmorphism pills, SF-style icons, spring animations.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
    Lightbulb,
    Bug,
    BookOpen,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

interface SuggestionChipsProps {
    /** Called when the user clicks a suggestion */
    onSelect: (text: string) => void;
    /** Hide when a task is already in progress or input is non-empty */
    visible: boolean;
}

interface QuickStartCard {
    icon: LucideIcon;
    titleKey: string;
    promptKey: string;
    color: string;
    bgColor: string;
}

const QUICK_STARTS: QuickStartCard[] = [
    {
        icon: TrendingUp,
        titleKey: 'suggestions.cards.market.title',
        promptKey: 'suggestions.cards.market.prompt',
        color: 'text-apple-blue',
        bgColor: 'bg-apple-blue/8',
    },
    {
        icon: Lightbulb,
        titleKey: 'suggestions.cards.strategy.title',
        promptKey: 'suggestions.cards.strategy.prompt',
        color: 'text-apple-orange',
        bgColor: 'bg-apple-orange/8',
    },
    {
        icon: Bug,
        titleKey: 'suggestions.cards.debug.title',
        promptKey: 'suggestions.cards.debug.prompt',
        color: 'text-apple-red',
        bgColor: 'bg-apple-red/8',
    },
    {
        icon: BookOpen,
        titleKey: 'suggestions.cards.research.title',
        promptKey: 'suggestions.cards.research.prompt',
        color: 'text-apple-purple',
        bgColor: 'bg-apple-purple/8',
    },
];

const chipVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 8 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            delay: 0.1 + i * 0.06,
            type: 'spring' as const,
            stiffness: 200,
            damping: 22,
        },
    }),
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.3 + i * 0.08,
            type: 'spring' as const,
            stiffness: 140,
            damping: 20,
        },
    }),
};

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSelect, visible }) => {
    const { t } = useTranslation();

    if (!visible) return null;

    const chipKeys = [
        'suggestions.chips.market',
        'suggestions.chips.strategy',
        'suggestions.chips.debug',
        'suggestions.chips.research',
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl mx-auto space-y-8"
        >
            {/* Suggestion Chips */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('suggestions.title')}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {chipKeys.map((key, i) => (
                        <motion.button
                            key={key}
                            custom={i}
                            variants={chipVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelect(t(key))}
                            className="px-4 py-2.5 rounded-full bg-card border border-border text-[14px] font-medium text-foreground/80 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 shadow-apple-sm hover:shadow-apple-md min-h-[44px] cursor-pointer"
                        >
                            {t(key)}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Quick Start Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_STARTS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.button
                            key={card.titleKey}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(t(card.promptKey))}
                            className="group relative flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all duration-300 shadow-apple-sm hover:shadow-apple-md text-left cursor-pointer min-h-[44px]"
                        >
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                    {t(card.titleKey)}
                                </h3>
                                <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                                    {t(card.promptKey)}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};
