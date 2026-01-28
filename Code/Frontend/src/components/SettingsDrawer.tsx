import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Moon, Sun, Monitor, Key, Eye, EyeOff,
    Loader2, CheckCircle2, AlertCircle, RefreshCw, Wifi, WifiOff,
    Thermometer, Hash, Sparkles, ChevronDown, Save, RotateCcw, Search, Gift, Zap, Shield, Repeat, ArrowRightLeft, Clock
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// ============ TYPES ============
interface SettingsConfig {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    apiKey?: string;
    /** Timeout en secondes pour les requêtes API */
    timeout: number;
}

interface ResilienceSettings {
    rateLimit: number;
    retryEnabled: boolean;
    fallbackEnabled: boolean;
}

interface ProviderStatus {
    connected: boolean;
    lastCheck: Date | null;
    error?: string;
}

interface ModelData {
    providers: string[];
    models: { [key: string]: string[] };
    modelsDetailed?: { [key: string]: { id: string; is_free: boolean }[] };
    defaultParams?: { [key: string]: { temperature: number; max_tokens: number; top_p: number } };
}

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: SettingsConfig) => void;
}

// ============ CONSTANTS ============
const STORAGE_KEY = 'autologic_settings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const PROVIDER_INFO: Record<string, { color: string; icon: string; requiresKey: boolean }> = {
    OpenAI: { color: 'from-green-500 to-emerald-600', icon: '🤖', requiresKey: true },
    OpenRouter: { color: 'from-purple-500 to-violet-600', icon: '🌐', requiresKey: true },
    Ollama: { color: 'from-orange-500 to-amber-600', icon: '🦙', requiresKey: true },
    vLLM: { color: 'from-blue-600 to-indigo-600', icon: '🚀', requiresKey: true },
    HuggingFace: { color: 'from-yellow-500 to-orange-600', icon: '🤗', requiresKey: true },
};

// ============ UTILS ============
// Simple XOR encryption for localStorage (not secure for production, use backend for real security)
const encryptKey = (key: string): string => {
    const salt = 'autologic_salt_2024';
    return btoa(key.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
    ).join(''));
};

const decryptKey = (encrypted: string): string => {
    try {
        const salt = 'autologic_salt_2024';
        const decoded = atob(encrypted);
        return decoded.split('').map((c, i) =>
            String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
        ).join('');
    } catch {
        return '';
    }
};

// ============ HOOKS ============
const useModelCache = () => {
    const [cache, setCache] = useState<{ data: ModelData | null; timestamp: number }>({
        data: null,
        timestamp: 0
    });

    const isValid = useCallback(() => {
        return cache.data && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache]);

    const updateCache = useCallback((data: ModelData) => {
        setCache({ data, timestamp: Date.now() });
    }, []);

    return { cache: cache.data, isValid, updateCache };
};

const usePersistedSettings = (initialConfig: SettingsConfig) => {
    const [settings, setSettings] = useState<SettingsConfig>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.apiKey) {
                    parsed.apiKey = decryptKey(parsed.apiKey);
                }
                return { ...initialConfig, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load settings from localStorage:', e);
        }
        return initialConfig;
    });

    const saveSettings = useCallback((newSettings: SettingsConfig) => {
        setSettings(newSettings);
        try {
            const toStore = { ...newSettings };
            if (toStore.apiKey) {
                toStore.apiKey = encryptKey(toStore.apiKey);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }, []);

    return { settings, saveSettings };
};

// ============ COMPONENTS ============
const Slider: React.FC<{
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
    icon: React.ReactNode;
    unit?: string;
}> = ({ value, onChange, min, max, step, label, icon, unit = '' }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-sm font-mono text-indigo-400">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
    </div>
);

const ConnectionIndicator: React.FC<{ status: ProviderStatus }> = ({ status }) => (
    <div className="flex items-center gap-2">
        {status.lastCheck === null ? (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Wifi className="w-3 h-3" />
                <span>Non testé</span>
            </div>
        ) : status.connected ? (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connecté</span>
            </div>
        ) : (
            <div className="flex items-center gap-1 text-xs text-red-400">
                <WifiOff className="w-3 h-3" />
                <span title={status.error}>Erreur</span>
            </div>
        )}
    </div>
);

// ============ MAIN COMPONENT ============
const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onConfigChange }) => {
    const { theme, setTheme } = useTheme();
    const { cache, isValid, updateCache } = useModelCache();

    const defaultConfig: SettingsConfig = {
        provider: 'OpenRouter',
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
        apiKey: '',
        timeout: 120
    };

    const { settings, saveSettings } = usePersistedSettings(defaultConfig);
    const [localSettings, setLocalSettings] = useState<SettingsConfig>(settings);
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [providerStatus, setProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    const [testingConnection, setTestingConnection] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Searchable select state
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [modelSearchQuery, setModelSearchQuery] = useState('');
    const [freeModelsOnly, setFreeModelsOnly] = useState(false);
    const [autoModelSelection, setAutoModelSelection] = useState(() =>
        settings.model === 'openrouter/auto'
    );

    // Resilience settings state
    const [resilienceSettings, setResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 5,
        retryEnabled: false,
        fallbackEnabled: false
    });

    // Fetch models with cache logic
    const fetchModels = useCallback(async (force = false, providerOverride?: string) => {
        const providerToFetch = providerOverride || localSettings.provider;

        // Optimisation: use cache if valid and we are not forcing refresh
        // BUT we need to check if we have data for this provider
        if (!force && isValid() && cache && cache.models[providerToFetch]) {
            setModelData(cache);
            return;
        }

        setLoading(true);
        try {
            // First fetch global providers list if needed (usually only once)
            // But here we want spesific provider models

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (localSettings.apiKey) {
                headers['X-Api-Key'] = localSettings.apiKey;
            }

            const response = await fetch(`http://127.0.0.1:8000/api/providers/${providerToFetch.toLowerCase()}/models`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();

                // Merge with existing data
                setModelData(prev => {
                    const newData = {
                        providers: prev?.providers || Object.keys(PROVIDER_INFO),
                        models: {
                            ...(prev?.models || {}),
                            [providerToFetch]: data.models
                        },
                        modelsDetailed: {
                            ...(prev?.modelsDetailed || {}),
                            [providerToFetch]: data.models_detailed || []
                        },
                        defaultParams: prev?.defaultParams
                    };
                    updateCache(newData);
                    return newData;
                });
            } else {
                console.warn(`Failed to fetch models for ${providerToFetch}`);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoading(false);
        }
    }, [cache, isValid, updateCache, localSettings.apiKey, localSettings.provider]);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
        }
    }, [isOpen, settings]);

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [fetchModels, isOpen]);

    // Fetch resilience config for OpenRouter
    useEffect(() => {
        if (isOpen && localSettings.provider === 'OpenRouter') {
            fetch('http://127.0.0.1:8000/api/providers/openrouter/resilience')
                .then(res => res.json())
                .then(data => {
                    setResilienceSettings({
                        rateLimit: data.rate_limit ?? 5,
                        retryEnabled: data.retry_enabled ?? false,
                        fallbackEnabled: data.fallback_enabled ?? false
                    });
                })
                .catch(err => console.warn('Failed to fetch resilience config:', err));
        }
    }, [isOpen, localSettings.provider]);

    // Track changes
    useEffect(() => {
        setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
    }, [localSettings, settings]);

    // Update model when provider changes
    useEffect(() => {
        if (modelData && localSettings.provider) {
            const models = modelData.models[localSettings.provider] || [];
            if (models.length > 0 && !models.includes(localSettings.model)) {
                setLocalSettings(prev => ({ ...prev, model: models[0] }));
            }
        }
    }, [localSettings.provider, modelData]);

    // Test connection
    const testConnection = async () => {
        setTestingConnection(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/providers/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: localSettings.provider,
                    api_key: localSettings.apiKey
                })
            });

            if (response.ok) {
                setProviderStatus({
                    connected: true,
                    lastCheck: new Date(),
                    error: undefined
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setProviderStatus({
                    connected: false,
                    lastCheck: new Date(),
                    error: errorData.detail || `Status: ${response.status}`
                });
            }

        } catch (error) {
            setProviderStatus({
                connected: false,
                lastCheck: new Date(),
                error: error instanceof Error ? error.message : 'Connection failed'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    // Save settings
    const handleSave = async () => {
        setLoading(true);
        try {
            // Persist to backend
            const response = await fetch('http://127.0.0.1:8000/api/providers/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: localSettings.provider,
                    model: localSettings.model,
                    temperature: localSettings.temperature,
                    max_tokens: localSettings.maxTokens,
                    top_p: localSettings.topP
                })
            });

            if (!response.ok) {
                console.error('Failed to update backend config');
            }

            // Save resilience config for OpenRouter
            if (localSettings.provider === 'OpenRouter') {
                const resilienceResponse = await fetch('http://127.0.0.1:8000/api/providers/resilience', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: 'openrouter',
                        rate_limit: resilienceSettings.rateLimit,
                        retry_enabled: resilienceSettings.retryEnabled,
                        fallback_enabled: resilienceSettings.fallbackEnabled
                    })
                });

                if (!resilienceResponse.ok) {
                    console.error('Failed to update resilience config');
                }
            }

            saveSettings(localSettings);
            onConfigChange(localSettings);
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset to defaults
    const handleReset = () => {
        setLocalSettings(defaultConfig);
    };

    const availableModels = useMemo(() => {
        if (!modelData) return [];

        // Pour OpenRouter, filtrer par modèles gratuits si la checkbox est cochée
        if (localSettings.provider === 'OpenRouter' && freeModelsOnly) {
            const detailed = modelData.modelsDetailed?.[localSettings.provider] || [];
            return detailed
                .filter(m => m.is_free)
                .map(m => m.id)
                .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        }

        return (modelData.models[localSettings.provider] || []).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
    }, [modelData, localSettings.provider, freeModelsOnly]);

    const filteredModels = useMemo(() => {
        const query = modelSearchQuery.toLowerCase();
        return availableModels.filter(m => m.toLowerCase().includes(query));
    }, [availableModels, modelSearchQuery]);

    // Helper pour vérifier si un modèle est gratuit
    const isModelFree = useCallback((modelId: string): boolean => {
        if (localSettings.provider !== 'OpenRouter' || !modelData?.modelsDetailed) return false;
        const detailed = modelData.modelsDetailed[localSettings.provider] || [];
        const model = detailed.find(m => m.id === modelId);
        return model?.is_free ?? false;
    }, [modelData, localSettings.provider]);

    const currentProviderInfo = PROVIDER_INFO[localSettings.provider] || {
        color: 'from-gray-500 to-gray-600',
        icon: '⚡',
        requiresKey: false
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${currentProviderInfo.color}`}>
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
                                    <ConnectionIndicator status={providerStatus} />
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Theme Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Apparence</label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950/50 rounded-xl border border-zinc-800">
                                    {[
                                        { key: 'light', icon: Sun, label: 'Clair' },
                                        { key: 'dark', icon: Moon, label: 'Sombre' },
                                        { key: 'system', icon: Monitor, label: 'Auto' }
                                    ].map(({ key, icon: Icon, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setTheme(key as 'light' | 'dark' | 'system')}
                                            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-sm transition-all ${theme === key
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Provider Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Provider</label>
                                    <button
                                        onClick={() => fetchModels(true)}
                                        disabled={loading}
                                        className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        title="Rafraîchir"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <select
                                        value={localSettings.provider}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, provider: e.target.value }))}
                                        disabled={loading}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? (
                                            <option>Chargement...</option>
                                        ) : (
                                            modelData?.providers.map((p) => (
                                                <option key={p} value={p}>
                                                    {PROVIDER_INFO[p]?.icon || '⚡'} {p}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>

                                {/* Free models filter - OpenRouter only */}
                                {localSettings.provider === 'OpenRouter' && (
                                    <div className="space-y-2 mt-3">
                                        {/* Auto model delegation */}
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={autoModelSelection}
                                                    onChange={(e) => {
                                                        setAutoModelSelection(e.target.checked);
                                                        if (e.target.checked) {
                                                            setLocalSettings(prev => ({ ...prev, model: 'openrouter/auto' }));
                                                        } else {
                                                            // Reset to first available model
                                                            const models = modelData?.models[localSettings.provider] || [];
                                                            if (models.length > 0) {
                                                                setLocalSettings(prev => ({ ...prev, model: models[0] }));
                                                            }
                                                        }
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-purple-600 transition-colors" />
                                                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
                                            </div>
                                            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5" />
                                                Déléguer à OpenRouter (auto)
                                            </span>
                                        </label>

                                        {/* Free models only - only shown when not in auto mode */}
                                        {!autoModelSelection && (
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={freeModelsOnly}
                                                        onChange={(e) => setFreeModelsOnly(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-emerald-600 transition-colors" />
                                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
                                                </div>
                                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                                                    <Gift className="w-3.5 h-3.5" />
                                                    Modèles gratuits uniquement
                                                </span>
                                            </label>
                                        )}

                                        {/* Resilience section */}
                                        <div className="mt-4 pt-4 border-t border-zinc-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Shield className="w-4 h-4 text-amber-500" />
                                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Résilience</span>
                                            </div>

                                            {/* Rate limit input */}
                                            <div className="space-y-2 mb-3">
                                                <label className="text-xs text-zinc-500 flex items-center gap-1.5">
                                                    <Hash className="w-3 h-3" />
                                                    Requêtes par seconde
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    max="100"
                                                    step="0.5"
                                                    value={resilienceSettings.rateLimit}
                                                    onChange={(e) => setResilienceSettings(prev => ({
                                                        ...prev,
                                                        rateLimit: Math.max(0.1, parseFloat(e.target.value) || 5)
                                                    }))}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50"
                                                />
                                            </div>

                                            {/* Retry toggle */}
                                            <label className="flex items-center gap-2 cursor-pointer group mb-2">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={resilienceSettings.retryEnabled}
                                                        onChange={(e) => setResilienceSettings(prev => ({
                                                            ...prev,
                                                            retryEnabled: e.target.checked
                                                        }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-amber-600 transition-colors" />
                                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
                                                </div>
                                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                                                    <Repeat className="w-3.5 h-3.5" />
                                                    Retry auto (429/5xx)
                                                </span>
                                            </label>

                                            {/* Fallback toggle */}
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={resilienceSettings.fallbackEnabled}
                                                        onChange={(e) => setResilienceSettings(prev => ({
                                                            ...prev,
                                                            fallbackEnabled: e.target.checked
                                                        }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-amber-600 transition-colors" />
                                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-400 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all" />
                                                </div>
                                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors flex items-center gap-1.5">
                                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                                    Fallback si saturé
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Model Selection - Hidden when OpenRouter auto mode is enabled */}
                            {!(localSettings.provider === 'OpenRouter' && autoModelSelection) && (
                                <div className="space-y-3 relative">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Modèle</label>

                                    <button
                                        onClick={() => {
                                            if (!loading && availableModels.length > 0) {
                                                setIsModelDropdownOpen(!isModelDropdownOpen);
                                            }
                                        }}
                                        disabled={loading || availableModels.length === 0}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-left text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-between hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="truncate">{localSettings.model || (loading ? "Chargement..." : "Sélectionner un modèle...")}</span>
                                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isModelDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-72"
                                                >
                                                    <div className="p-2 border-b border-zinc-800 bg-zinc-900 sticky top-0">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                            <input
                                                                type="text"
                                                                placeholder="Rechercher..."
                                                                value={modelSearchQuery}
                                                                onChange={(e) => setModelSearchQuery(e.target.value)}
                                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/50"
                                                                autoFocus
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                                        {filteredModels.length === 0 ? (
                                                            <div className="p-3 text-center text-sm text-zinc-500">Aucun modèle trouvé</div>
                                                        ) : (
                                                            filteredModels.map((model) => (
                                                                <button
                                                                    key={model}
                                                                    onClick={() => {
                                                                        setLocalSettings(prev => ({ ...prev, model }));
                                                                        setIsModelDropdownOpen(false);
                                                                        setModelSearchQuery('');
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${localSettings.model === model
                                                                        ? 'bg-indigo-600/20 text-indigo-300'
                                                                        : 'text-zinc-300 hover:bg-zinc-800'
                                                                        }`}
                                                                >
                                                                    <span className="truncate">{model}</span>
                                                                    {localSettings.provider === 'OpenRouter' && isModelFree(model) && (
                                                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-md flex-shrink-0">
                                                                            FREE
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Auto mode info box */}
                            {localSettings.provider === 'OpenRouter' && autoModelSelection && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                                        <Zap className="w-4 h-4" />
                                        <span className="font-medium text-sm">Mode automatique activé</span>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        OpenRouter sélectionnera automatiquement le meilleur modèle gratuit pour chaque requête.
                                    </p>
                                </div>
                            )}

                            {/* API Key (if required) */}
                            {currentProviderInfo.requiresKey && (
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5" />
                                        Clé API
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={localSettings.apiKey || ''}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                            placeholder="sk-..."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-600">
                                        🔒 Stockée localement de manière chiffrée
                                    </p>
                                </div>
                            )}

                            {/* Advanced Settings Toggle */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                <span className="text-sm font-medium">Paramètres avancés</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Advanced Parameters */}
                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <Slider
                                            value={localSettings.temperature}
                                            onChange={(v) => setLocalSettings(prev => ({ ...prev, temperature: v }))}
                                            min={0}
                                            max={2}
                                            step={0.1}
                                            label="Température"
                                            icon={<Thermometer className="w-4 h-4" />}
                                        />
                                        <Slider
                                            value={localSettings.maxTokens}
                                            onChange={(v) => setLocalSettings(prev => ({ ...prev, maxTokens: v }))}
                                            min={256}
                                            max={8192}
                                            step={256}
                                            label="Max Tokens"
                                            icon={<Hash className="w-4 h-4" />}
                                        />
                                        <Slider
                                            value={localSettings.topP}
                                            onChange={(v) => setLocalSettings(prev => ({ ...prev, topP: v }))}
                                            min={0}
                                            max={1}
                                            step={0.05}
                                            label="Top P"
                                            icon={<Sparkles className="w-4 h-4" />}
                                        />
                                        <Slider
                                            value={localSettings.timeout}
                                            onChange={(v) => setLocalSettings(prev => ({ ...prev, timeout: v }))}
                                            min={30}
                                            max={300}
                                            step={10}
                                            label="Timeout"
                                            icon={<Clock className="w-4 h-4" />}
                                            unit="s"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Test Connection */}
                            <button
                                onClick={testConnection}
                                disabled={testingConnection}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50"
                            >
                                {testingConnection ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Wifi className="w-4 h-4" />
                                )}
                                <span>Tester la connexion</span>
                            </button>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Réinitialiser</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${hasChanges
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Sauvegarder</span>
                                </button>
                            </div>
                            {hasChanges && (
                                <p className="text-xs text-center text-amber-400">
                                    Modifications non enregistrées
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SettingsDrawer;
