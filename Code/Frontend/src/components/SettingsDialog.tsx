import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: { provider: string; model: string }) => void;
}

interface ModelData {
    providers: string[];
    models: { [key: string]: string[] };
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onConfigChange }) => {
    const { theme, setTheme } = useTheme();
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/models');
                if (response.ok) {
                    const data = await response.json();
                    setModelData(data);
                    // Set defaults if available
                    if (data.providers.length > 0) {
                        const defaultProvider = data.providers.includes("OpenAI") ? "OpenAI" : data.providers[0];
                        setSelectedProvider(defaultProvider);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch models:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && !modelData) {
            fetchModels();
        }
    }, [isOpen, modelData]);

    // Update selected model when provider changes
    useEffect(() => {
        if (modelData && selectedProvider) {
            const models = modelData.models[selectedProvider] || [];
            if (models.length > 0) {
                setSelectedModel(models[0]);
            } else {
                setSelectedModel('');
            }
        }
    }, [selectedProvider, modelData]);

    // Notify parent of config changes
    useEffect(() => {
        if (selectedProvider && selectedModel) {
            onConfigChange({ provider: selectedProvider, model: selectedModel });
        }
    }, [selectedProvider, selectedModel, onConfigChange]);

    const availableModels = modelData?.models[selectedProvider] || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-100">
                                <SettingsIcon className="w-5 h-5" />
                                <h2 className="text-lg font-semibold">Settings</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">

                            {/* Theme Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Appearance</label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${theme === 'light' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    >
                                        <Sun className="w-4 h-4" />
                                        <span>Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    >
                                        <Moon className="w-4 h-4" />
                                        <span>Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme("system")}
                                        className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm transition-all ${theme === 'system' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    >
                                        <Monitor className="w-4 h-4" />
                                        <span>System</span>
                                    </button>
                                </div>
                            </div>

                            {/* Provider Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">AI Provider</label>
                                <div className="relative">
                                    <select
                                        value={selectedProvider}
                                        onChange={(e) => setSelectedProvider(e.target.value)}
                                        disabled={loading || !modelData}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <option>Loading providers...</option>
                                        ) : (
                                            modelData?.providers.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Model</label>
                                <div className="relative">
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        disabled={loading || !selectedProvider || availableModels.length === 0}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50"
                                    >
                                        {availableModels.length === 0 ? (
                                            <option>No models available</option>
                                        ) : (
                                            availableModels.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SettingsDialog;
