/**
 * Prompts Manager Component
 * 
 * Allows users to view, create, edit, and select prompts.
 * Uses Liquid Glass aesthetics.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ArrowRight, Save, Tag } from 'lucide-react';
import { promptsApi } from '../services/api';
import type { Prompt, PromptCreate } from '../types';

interface PromptsManagerProps {
    onSelect: (content: string) => void;
}

export const PromptsManager: React.FC<PromptsManagerProps> = ({ onSelect }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
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
            setError('Failed to load prompts.');
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
            setError('Title and Content are required.');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
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
            setError(err instanceof Error ? err.message : 'Failed to save prompt.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this prompt?')) return;

        try {
            await promptsApi.delete(id);
            await loadPrompts();
        } catch (err) {
            console.error(err);
            setError('Failed to delete prompt.');
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        Prompt Library
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Manage and reuse your reasoning strategies
                    </p>
                </div>

                {!isEditing && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Prompt</span>
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col space-y-4"
                    >
                        <div className="space-y-4 bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-black/5 dark:border-white/10 backdrop-blur-sm">
                            <input
                                type="text"
                                placeholder="Prompt Title"
                                value={currentPrompt.title || ''}
                                onChange={e => setCurrentPrompt({ ...currentPrompt, title: e.target.value })}
                                className="w-full bg-transparent text-xl font-bold outline-none placeholder:text-zinc-400"
                            />

                            <div className="flex items-center gap-2 text-zinc-500">
                                <Tag className="w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tags (comma separated)"
                                    value={tagsInput}
                                    onChange={e => setTagsInput(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
                                />
                            </div>

                            <textarea
                                placeholder="Enter prompt content..."
                                value={currentPrompt.content || ''}
                                onChange={e => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                                className="w-full h-64 bg-black/5 dark:bg-white/5 rounded-xl p-4 text-sm font-mono outline-none resize-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => { setIsEditing(false); setError(null); }}
                                    className="px-4 py-2 text-zinc-500 hover:text-foreground transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span>{isSaving ? 'Saving...' : 'Save Prompt'}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400"
                            />
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-10 text-zinc-400">Loading prompts...</div>
                        )}

                        {/* Empty State */}
                        {!isLoading && filteredPrompts.length === 0 && (
                            <div className="text-center py-20 text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                <p>No prompts found.</p>
                                <button onClick={handleCreate} className="text-indigo-500 hover:underline mt-2">
                                    Create your first prompt
                                </button>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPrompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    className="group relative bg-white/40 dark:bg-zinc-900/40 border border-black/5 dark:border-white/5 rounded-2xl p-5 hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                    onClick={() => onSelect(prompt.content)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-foreground truncate pr-8">
                                            {prompt.title}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(prompt); }}
                                                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-zinc-500 hover:text-indigo-500"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(prompt.id, e)}
                                                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-500"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 font-mono bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-transparent">
                                        {prompt.content}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-wrap gap-2">
                                            {prompt.tags.map(tag => (
                                                <span key={tag} className="text-[10px] uppercase font-medium tracking-wider px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="flex items-center gap-1 text-xs font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Use <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
