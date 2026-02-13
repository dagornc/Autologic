/**
 * Prompts Manager Component — Apple HIG 2025
 *
 * Theme-aware design: uses CSS variable tokens (bg-card, text-foreground,
 * border-border, bg-muted) so it adapts automatically to light/dark mode.
 * Inspired by Stitch designs for both themes.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ArrowRight,
    Save,
    Tag,
    FileText,
    Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { promptsApi } from '../services/api';
import type { Prompt, PromptCreate } from '../types';

interface PromptsManagerProps {
    onSelect: (content: string) => void;
}

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
    }),
};

export const PromptsManager: React.FC<PromptsManagerProps> = ({ onSelect }) => {
    const { t } = useTranslation();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt>>({});
    const [tagsInput, setTagsInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            setIsLoading(true);
            const data = await promptsApi.getAll();
            setPrompts(data);
            setError(null);
        } catch (err) {
            setError(t('common.error'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (prompt: Prompt) => {
        setCurrentPrompt(prompt);
        setTagsInput(prompt.tags.join(', '));
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentPrompt({ title: '', content: '' });
        setTagsInput('');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentPrompt.title?.trim() || !currentPrompt.content?.trim()) {
            setError(t('common.error'));
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
            const promptData = {
                title: currentPrompt.title.trim(),
                content: currentPrompt.content.trim(),
                tags
            };

            if (currentPrompt.id) {
                await promptsApi.update(currentPrompt.id, promptData);
            } else {
                await promptsApi.create(promptData as PromptCreate);
            }

            await loadPrompts();
            setIsEditing(false);
            setCurrentPrompt({});
            setTagsInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('common.error'));
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('prompts.confirmDelete'))) return;

        try {
            await promptsApi.delete(id);
            await loadPrompts();
        } catch (err) {
            console.error(err);
            setError(t('common.error'));
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full flex flex-col space-y-6"
        >
            {/* ── Header — Apple HIG ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/25 shadow-[0_0_24px_rgba(99,102,241,0.12)]">
                        <Tag className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-[24px] font-bold text-foreground tracking-tight">
                            {t('prompts.title')}
                        </h2>
                        <p className="text-[13px] text-muted-foreground">
                            {t('prompts.subtitle')}
                        </p>
                    </div>
                </div>

                {!isEditing && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600
                                   dark:hover:bg-indigo-400
                                   text-white rounded-full transition-all duration-300
                                   shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35
                                   min-h-[44px] text-[14px] font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('prompts.newPrompt')}</span>
                    </motion.button>
                )}
            </div>

            {/* ── Error Banner ── */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[14px] font-medium"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content ── */}
            <AnimatePresence mode="wait">
                {isEditing ? (
                    /* ──────── EDITOR FORM ──────── */
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col space-y-4"
                    >
                        <div className="space-y-5 bg-card/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-border shadow-xl">
                            {/* Title */}
                            <div>
                                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                                    {t('prompts.nameLabel')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('prompts.namePlaceholder')}
                                    value={currentPrompt.title || ''}
                                    onChange={e => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                                    className="w-full bg-transparent text-[20px] font-bold text-foreground outline-none
                                               placeholder:text-muted-foreground/50
                                               border-b border-border pb-3 focus:border-indigo-500/50 transition-colors"
                                />
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Tag className="w-4 h-4 text-indigo-500/60 dark:text-indigo-400/60" />
                                <input
                                    type="text"
                                    placeholder={t('prompts.categoryLabel')}
                                    value={tagsInput}
                                    onChange={e => setTagsInput(e.target.value)}
                                    className="flex-1 bg-transparent text-[14px] text-foreground/80 outline-none placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                                    {t('prompts.contentLabel')}
                                </label>
                                <textarea
                                    placeholder={t('prompts.contentPlaceholder')}
                                    value={currentPrompt.content || ''}
                                    onChange={e => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                                    className="w-full h-64 bg-muted/30 rounded-xl p-4 text-[14px] font-mono
                                               text-foreground/85 outline-none resize-none
                                               focus:ring-2 focus:ring-indigo-500/30 transition-all
                                               border border-border placeholder:text-muted-foreground/40
                                               leading-relaxed"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    onClick={() => { setIsEditing(false); setError(null); }}
                                    className="px-5 py-2.5 text-muted-foreground hover:text-foreground transition-colors
                                               rounded-full hover:bg-muted/30 min-h-[44px] text-[14px] font-medium"
                                    disabled={isSaving}
                                >
                                    {t('prompts.cancel')}
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600
                                               dark:hover:bg-indigo-400
                                               disabled:opacity-50 disabled:cursor-not-allowed
                                               text-white rounded-full transition-all duration-300
                                               shadow-lg shadow-indigo-500/25 min-h-[44px] text-[14px] font-semibold"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span>{isSaving ? t('common.loading') : t('prompts.save')}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* ──────── LIST VIEW ──────── */
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 space-y-6"
                    >
                        {/* Search Bar — Apple HIG pill */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('prompts.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-full
                                           py-3 pl-11 pr-4 outline-none
                                           focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/30
                                           transition-all text-[15px] text-foreground
                                           placeholder:text-muted-foreground/60
                                           min-h-[44px] backdrop-blur-sm"
                            />
                        </div>

                        {/* Loading State — Skeleton */}
                        {isLoading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className="h-[180px] rounded-2xl bg-muted/20 border border-border animate-pulse"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State — Stitch-inspired */}
                        {!isLoading && filteredPrompts.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 border-2 border-dashed border-border rounded-2xl space-y-4"
                            >
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                    <FileText className="w-6 h-6 text-indigo-500/70 dark:text-indigo-400/70" />
                                </div>
                                <p className="text-foreground font-semibold text-[18px]">
                                    {t('prompts.emptyState')}
                                </p>
                                <p className="text-muted-foreground text-[14px] max-w-sm mx-auto">
                                    {t('prompts.emptyStateDesc')}
                                </p>
                                <button
                                    onClick={handleCreate}
                                    className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300
                                               text-[15px] font-semibold
                                               min-h-[44px] inline-flex items-center gap-1.5 transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {t('prompts.emptyStateAction')}
                                </button>
                                <div className="flex items-center justify-center gap-4 pt-2 text-[12px] text-muted-foreground/50">
                                    <span>⌘N {t('prompts.toCreate')}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Cards Grid — theme-aware glassmorphism cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPrompts.map((prompt, index) => (
                                <motion.div
                                    key={prompt.id}
                                    custom={index}
                                    initial="hidden"
                                    animate="visible"
                                    variants={cardVariants}
                                    whileHover={{ scale: 1.015, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative overflow-hidden
                                               bg-card/70 dark:bg-card/50 border border-border
                                               hover:border-indigo-500/30 rounded-2xl p-5
                                               transition-all duration-300 cursor-pointer
                                               shadow-sm hover:shadow-lg hover:shadow-indigo-500/[0.08]
                                               backdrop-blur-sm"
                                    onClick={() => onSelect(prompt.content)}
                                >
                                    {/* Accent bar — indigo-to-purple gradient */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-600 opacity-40 group-hover:opacity-90 transition-opacity duration-300" />

                                    <div className="pl-4">
                                        {/* Title row */}
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-[15px] text-foreground truncate pr-16 tracking-tight">
                                                {prompt.title}
                                            </h3>
                                            {/* Hover actions */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-4 right-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(prompt); }}
                                                    className="p-2 hover:bg-muted/40 rounded-xl text-muted-foreground hover:text-indigo-500
                                                               dark:hover:text-indigo-400
                                                               transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                    title={t('prompts.edit')}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(prompt.id, e)}
                                                    className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive
                                                               transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                                                    title={t('prompts.delete')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Prompt ID */}
                                        <p className="text-[11px] text-muted-foreground/60 font-mono mb-3">
                                            ID: {prompt.id.slice(0, 8)}
                                        </p>

                                        {/* Content preview — monospace code block */}
                                        <div className="bg-muted/20 dark:bg-muted/30 rounded-xl p-3 border border-border mb-4">
                                            <p className="text-[12px] text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                                                {prompt.content}
                                            </p>
                                        </div>

                                        {/* Footer: Tags + Use action */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1.5">
                                                {prompt.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] uppercase font-bold tracking-wider
                                                                   px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300
                                                                   rounded-full border border-indigo-500/15"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="flex items-center gap-1 text-[13px] font-semibold
                                                             text-indigo-500 dark:text-indigo-400
                                                             opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {t('prompts.use')} <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer status */}
                        {!isLoading && filteredPrompts.length > 0 && (
                            <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                                <span className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                                    {filteredPrompts.length} {t('prompts.promptCount')}
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
