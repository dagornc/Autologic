/**
 * History Display Component — Apple HIG 2025 Multilingual
 *
 * List & detail view for past reasoning sessions.
 * Glass-morphism cards with accent bars, metadata display.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Trash2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlanDisplay, SolutionDisplay } from './ui';
import { API_BASE_URL } from '../services/api';
import type { ReasoningPlan } from '../types';

interface HistoryItem {
    id: string;
    timestamp: string;
    task: string;
    plan: { plan: ReasoningPlan };
    final_output: string;
}

const HistoryDisplay: React.FC = () => {
    const { t } = useTranslation();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/history/`);
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteHistory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm(t('history.confirmDelete'))) return;

        try {
            const response = await fetch(`${API_BASE_URL}/history/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
                if (selectedItem?.id === id) setSelectedItem(null);
            }
        } catch (err) {
            console.error('Failed to delete history item', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
                <Clock className="w-6 h-6 mr-3" />
                <span className="text-[15px]">{t('history.loading')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-[15px]">
                {error}
            </div>
        );
    }

    /* Detail View */
    if (selectedItem) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center text-muted-foreground hover:text-primary transition-colors group min-h-[44px] px-2 rounded-xl hover:bg-muted/30"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[15px] font-medium">{t('history.back')}</span>
                    </button>
                    <div className="text-[13px] font-mono text-muted-foreground tracking-tight">
                        {new Date(selectedItem.timestamp).toLocaleString()}
                    </div>
                </div>

                {/* Task Summary */}
                <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 opacity-80" />
                    <div className="p-6 pl-5">
                        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-primary mb-2">
                            {t('history.task')}
                        </h3>
                        <p className="text-foreground text-[15px] leading-relaxed">{selectedItem.task}</p>
                    </div>
                </div>

                {/* Content */}
                {selectedItem.plan && selectedItem.plan.plan && (
                    <PlanDisplay plan={selectedItem.plan.plan} />
                )}

                <SolutionDisplay output={selectedItem.final_output} />
            </motion.div>
        );
    }

    /* List View */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header — Apple HIG */}
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                        {t('history.title')}
                    </h2>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                    <p className="text-muted-foreground text-[17px]">{t('history.emptyState')}</p>
                    <p className="text-muted-foreground/60 text-[15px]">{t('history.emptyStateAction')}</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative overflow-hidden p-5 bg-muted/20 hover:bg-muted/40
                                       border border-border hover:border-indigo-500/30
                                       rounded-2xl cursor-pointer transition-all duration-300
                                       shadow-sm hover:shadow-lg hover:shadow-indigo-500/5"
                        >
                            {/* Left accent bar */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600 opacity-40 group-hover:opacity-80 transition-opacity" />

                            <div className="flex justify-between items-start gap-4 pl-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-[13px] text-muted-foreground font-mono tracking-tight">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="text-[15px] font-medium text-foreground line-clamp-2 leading-relaxed group-hover:text-indigo-400 transition-colors">
                                        {item.task}
                                    </h3>
                                </div>
                                <button
                                    onClick={(e) => deleteHistory(e, item.id)}
                                    className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title={t('history.deleteTitle')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default HistoryDisplay;
