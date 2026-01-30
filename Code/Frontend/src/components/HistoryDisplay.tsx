import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Trash2, Calendar, FileText } from 'lucide-react';
import { PlanDisplay, SolutionDisplay } from './ui';
import type { ReasoningPlan } from '../types';

interface HistoryItem {
    id: string;
    timestamp: string;
    task: string;
    plan: { plan: ReasoningPlan }; // Nested structure based on backend response
    final_output: string;
}

const HistoryDisplay: React.FC = () => {
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
            const response = await fetch('http://localhost:8000/history/');
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
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const response = await fetch(`http://localhost:8000/history/${id}`, {
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
            <div className="flex items-center justify-center h-64 text-zinc-500 animate-pulse">
                <Clock className="w-6 h-6 mr-2" /> Loading history...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center">
                {error}
            </div>
        );
    }

    // Detail View
    if (selectedItem) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center text-zinc-500 hover:text-indigo-500 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to History
                    </button>
                    <div className="text-sm text-zinc-400">
                        {new Date(selectedItem.timestamp).toLocaleString()}
                    </div>
                </div>

                {/* Task Summary */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-black/5 dark:border-white/5">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-500">Task</h3>
                    <p className="text-foreground">{selectedItem.task}</p>
                </div>

                {/* Content */}
                {selectedItem.plan && selectedItem.plan.plan && (
                    <PlanDisplay plan={selectedItem.plan.plan} />
                )}

                <SolutionDisplay output={selectedItem.final_output} />
            </motion.div>
        );
    }

    // List View
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Clock className="w-7 h-7 text-indigo-500" />
                History
            </h2>

            {history.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                    No history found. Start a new conversation!
                </div>
            ) : (
                <div className="grid gap-4">
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group p-5 bg-white/40 dark:bg-zinc-900/40 hover:bg-white/80 dark:hover:bg-zinc-800/80 border border-black/5 dark:border-white/5 hover:border-indigo-500/30 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-lg"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-zinc-400" />
                                        <span className="text-xs text-zinc-400 font-mono">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-medium text-foreground line-clamp-2 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.task}
                                    </h3>
                                </div>
                                <button
                                    onClick={(e) => deleteHistory(e, item.id)}
                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete conversation"
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
