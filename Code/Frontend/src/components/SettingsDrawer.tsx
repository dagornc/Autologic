import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Key, Eye, EyeOff,
    Loader2, CheckCircle2, RefreshCw, Wifi, WifiOff,
    Thermometer, Hash, Sparkles, ChevronDown, Save, RotateCcw, Gift, Zap, Shield, Clock
} from 'lucide-react';

// ============ TYPES ============
interface SettingsConfig {
    provider: string;
    model: string;
    workerProvider?: string;
    workerModel?: string;
    useWorkerSameAsRoot: boolean;
    temperature: number;
    maxTokens: number;
    topP: number;
    apiKey?: string;
    /** Timeout en secondes pour les requêtes API */
    timeout: number;

    // Worker specific params
    workerTemperature?: number;
    workerMaxTokens?: number;
    workerTopP?: number;
    workerTimeout?: number;
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-sm font-mono text-primary">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
    </div>
);

const NumberInput: React.FC<{
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    label: string;
    icon: React.ReactNode;
    unit?: string;
}> = ({ value, onChange, min, max, label, icon, unit = '' }) => (
    <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || min)))}
                className="w-20 bg-background border border-input rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50 font-mono text-right"
            />
            <span className="text-xs text-zinc-600 min-w-[30px]">{unit}</span>
        </div>
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

// ============ REUSABLE UI COMPONENTS ============
const Toggle: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    icon?: React.ReactNode;
    colorClass?: string; // Kept for types but ignored for uniformity
}> = ({ checked, onChange, label, icon }) => (
    <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-muted/50 transition-colors">
        <div className="relative flex-shrink-0">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-input rounded-full peer peer-checked:bg-primary transition-colors border border-border`} />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 shadow-sm transition-all" />
        </div>
        {(label || icon) && (
            <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors flex items-center gap-2 select-none">
                {icon}
                {label}
            </span>
        )}
    </label>
);

const ResilienceSection: React.FC<{
    settings: ResilienceSettings;
    onChange: (s: ResilienceSettings) => void;
    colorClass?: string;
}> = ({ settings, onChange, colorClass = "text-amber-500" }) => (
    <div className="pt-2 border-t border-border mt-3">
        <div className="flex items-center gap-2 mb-3 px-1">
            <Shield className={`w-3 h-3 ${colorClass}`} />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Résilience</span>
        </div>
        <div className="space-y-3">
            <div className="px-1">
                <NumberInput
                    value={settings.rateLimit}
                    onChange={(v) => onChange({ ...settings, rateLimit: v })}
                    min={1}
                    max={100}
                    label="Rate Limit"
                    icon={<Clock className="w-3 h-3" />}
                    unit="req/s"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Toggle
                    checked={settings.retryEnabled}
                    onChange={(v) => onChange({ ...settings, retryEnabled: v })}
                    label="Retry Auto"
                    colorClass="bg-amber-600"
                />
                <Toggle
                    checked={settings.fallbackEnabled}
                    onChange={(v) => onChange({ ...settings, fallbackEnabled: v })}
                    label="Fallback"
                    colorClass="bg-amber-600"
                />
            </div>
        </div>
    </div>
);

// ============ MAIN COMPONENT ============
const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onConfigChange }) => {
    const { cache, isValid, updateCache } = useModelCache();

    const defaultConfig: SettingsConfig = {
        provider: 'OpenRouter',
        model: 'google/gemini-2.0-flash-exp:free',
        workerProvider: 'OpenRouter',
        workerModel: 'google/gemini-2.0-flash-exp:free',
        useWorkerSameAsRoot: true,

        // Root Params
        temperature: 0.7,
        maxTokens: 8192,
        topP: 1.0,

        // Worker Params
        workerTemperature: undefined,
        workerMaxTokens: undefined,
        workerTopP: undefined,
        workerTimeout: undefined,

        apiKey: '',
        timeout: 600
    };

    const { settings, saveSettings } = usePersistedSettings(defaultConfig);
    const [localSettings, setLocalSettings] = useState<SettingsConfig>(settings);
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [providerStatus, setProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    const [workerProviderStatus, setWorkerProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    const [testingConnection, setTestingConnection] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showWorkerAdvanced, setShowWorkerAdvanced] = useState(false);

    // Searchable select state
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [modelSearchQuery, setModelSearchQuery] = useState('');

    // Worker select state
    const [isWorkerModelDropdownOpen, setIsWorkerModelDropdownOpen] = useState(false);
    const [workerModelSearchQuery, setWorkerModelSearchQuery] = useState('');

    const [freeModelsOnly, setFreeModelsOnly] = useState(false);

    // Worker States
    const [workerResilienceSettings, setWorkerResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 5,
        retryEnabled: true,
        fallbackEnabled: true
    });
    const [workerAutoModelSelection, setWorkerAutoModelSelection] = useState(false);
    const [workerFreeModelsOnly, setWorkerFreeModelsOnly] = useState(false);
    const [autoModelSelection, setAutoModelSelection] = useState(() =>
        settings.model === 'openrouter/auto'
    );

    // Resilience settings state
    const [resilienceSettings, setResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 5,
        retryEnabled: true,
        fallbackEnabled: true
    });

    // Fetch models with cache logic
    // Fetch models with cache logic
    const fetchModels = useCallback(async (force = false, providerOverride?: string) => {
        const providersToFetch = providerOverride
            ? [providerOverride]
            : Array.from(new Set([
                localSettings.provider,
                (!localSettings.useWorkerSameAsRoot && localSettings.workerProvider) ? localSettings.workerProvider : null
            ].filter(Boolean) as string[]));

        setLoading(true);
        try {
            await Promise.all(providersToFetch.map(async (p) => {
                // Optimisation: use cache if valid and we are not forcing refresh
                if (!force && isValid() && cache && cache.models[p]) {
                    setModelData(cache);
                    return;
                }

                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                if (localSettings.apiKey) {
                    headers['X-Api-Key'] = localSettings.apiKey;
                }

                const response = await fetch(`http://127.0.0.1:8000/api/providers/${p.toLowerCase()}/models`, {
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
                                [p]: data.models
                            },
                            modelsDetailed: {
                                ...(prev?.modelsDetailed || {}),
                                [p]: data.models_detailed || []
                            },
                            defaultParams: prev?.defaultParams
                        };
                        updateCache(newData);
                        return newData;
                    });
                } else {
                    console.warn(`Failed to fetch models for ${p}`);
                }
            }));
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoading(false);
        }
    }, [cache, isValid, updateCache, localSettings.apiKey, localSettings.provider, localSettings.workerProvider, localSettings.useWorkerSameAsRoot]);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings); // Load local storage first

            // Then fetch Backend truth
            fetch('http://127.0.0.1:8000/api/providers/config')
                .then(res => res.json())
                .then(data => {
                    // Helper to normalize provider names (backend might return lowercase)
                    const normalizeProvider = (p: string) => {
                        if (!p) return p;
                        const map: Record<string, string> = {
                            'openrouter': 'OpenRouter',
                            'ollama': 'Ollama',
                            'openai': 'OpenAI',
                            'anthropic': 'Anthropic',
                            'mistral': 'Mistral',
                            'groq': 'Groq',
                            'cohere': 'Cohere',
                            'huggingface': 'HuggingFace',
                            'vllm': 'vLLM'
                        };
                        return map[p.toLowerCase()] || p;
                    };

                    const activeProvider = normalizeProvider(data.active_provider);
                    const workerProvider = data.worker_provider ? normalizeProvider(data.worker_provider) : undefined;

                    setLocalSettings(prev => ({
                        ...prev,
                        provider: activeProvider,
                        model: data.active_model,
                        // If worker_provider is null in backend, it means fallback (same as root)
                        workerProvider: workerProvider || activeProvider,
                        workerModel: data.worker_model || data.active_model,
                        useWorkerSameAsRoot: !data.worker_provider,

                        temperature: data.temperature,
                        maxTokens: data.max_tokens,
                        topP: data.top_p,
                        timeout: data.timeout,

                        workerTemperature: data.worker_temperature,
                        workerMaxTokens: data.worker_max_tokens,
                        workerTopP: data.worker_top_p,
                        workerTimeout: data.worker_timeout
                    }));

                    if (data.active_model === 'openrouter/auto') setAutoModelSelection(true);
                    if (data.worker_model === 'openrouter/auto') setWorkerAutoModelSelection(true);
                })
                .catch(err => console.error("Config fetch error:", err));
        }
    }, [isOpen, settings]);

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [fetchModels, isOpen]);

    // State for tracking initial resilience values
    const [originalResilienceSettings, setOriginalResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 5,
        retryEnabled: true,
        fallbackEnabled: true
    });

    // Default worker resilience settings to track changes against
    const [originalWorkerResilienceSettings, setOriginalWorkerResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 5,
        retryEnabled: true,
        fallbackEnabled: true
    });

    // Fetch resilience config for OpenRouter (Root)
    useEffect(() => {
        if (isOpen && localSettings.provider === 'OpenRouter') {
            fetch('http://127.0.0.1:8000/api/providers/openrouter/resilience')
                .then(res => res.json())
                .then(data => {
                    const fetched = {
                        rateLimit: data.rate_limit ?? 5,
                        retryEnabled: data.retry_enabled ?? false,
                        fallbackEnabled: data.fallback_enabled ?? false
                    };
                    setResilienceSettings(fetched);
                    setOriginalResilienceSettings(fetched);
                })
                .catch(err => console.warn('Failed to fetch resilience config:', err));
        }
    }, [isOpen, localSettings.provider]);

    // Fetch resilience config for OpenRouter (Worker)
    useEffect(() => {
        if (isOpen && localSettings.workerProvider === 'OpenRouter' && !localSettings.useWorkerSameAsRoot) {
            fetch('http://127.0.0.1:8000/api/providers/openrouter/resilience')
                .then(res => res.json())
                .then(data => {
                    const fetched = {
                        rateLimit: data.rate_limit ?? 5,
                        retryEnabled: data.retry_enabled ?? false,
                        fallbackEnabled: data.fallback_enabled ?? false
                    };
                    setWorkerResilienceSettings(fetched);
                    setOriginalWorkerResilienceSettings(fetched);
                })
                .catch(err => console.warn('Failed to fetch worker resilience config:', err));
        }
    }, [isOpen, localSettings.workerProvider, localSettings.useWorkerSameAsRoot]);

    // Track changes
    useEffect(() => {
        const isSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
        const isResilienceChanged = JSON.stringify(resilienceSettings) !== JSON.stringify(originalResilienceSettings);
        // Track worker resilience changes (only if applicable, but simple check is okay as user editing it implies intent)
        const isWorkerResilienceChanged = JSON.stringify(workerResilienceSettings) !== JSON.stringify(originalWorkerResilienceSettings);

        setHasChanges(isSettingsChanged || isResilienceChanged || isWorkerResilienceChanged);
    }, [localSettings, settings, resilienceSettings, originalResilienceSettings, workerResilienceSettings, originalWorkerResilienceSettings]);

    // Update model when provider changes
    useEffect(() => {
        if (modelData) {
            // Root
            if (localSettings.provider) {
                const models = modelData.models[localSettings.provider] || [];
                if (models.length > 0 && !models.includes(localSettings.model)) {
                    setLocalSettings(prev => ({ ...prev, model: models[0] }));
                }
            }
            // Worker
            if (!localSettings.useWorkerSameAsRoot && localSettings.workerProvider) {
                const models = modelData.models[localSettings.workerProvider] || [];
                const currentWorkerModel = localSettings.workerModel || '';
                if (models.length > 0 && (!currentWorkerModel || !models.includes(currentWorkerModel))) {
                    setLocalSettings(prev => ({ ...prev, workerModel: models[0] }));
                }
            }
        }
    }, [localSettings.provider, localSettings.workerProvider, modelData, localSettings.useWorkerSameAsRoot, localSettings.model, localSettings.workerModel]);

    // Test connection (Root + Worker if separate)
    const testConnection = async () => {
        setTestingConnection(true);

        // Test Root provider
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
        }

        // Test Worker provider if separate
        if (!localSettings.useWorkerSameAsRoot && localSettings.workerProvider) {
            try {
                const workerResponse = await fetch('http://127.0.0.1:8000/api/providers/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: localSettings.workerProvider,
                        api_key: localSettings.apiKey
                    })
                });

                if (workerResponse.ok) {
                    setWorkerProviderStatus({
                        connected: true,
                        lastCheck: new Date(),
                        error: undefined
                    });
                } else {
                    const errorData = await workerResponse.json().catch(() => ({}));
                    setWorkerProviderStatus({
                        connected: false,
                        lastCheck: new Date(),
                        error: errorData.detail || `Status: ${workerResponse.status}`
                    });
                }
            } catch (error) {
                setWorkerProviderStatus({
                    connected: false,
                    lastCheck: new Date(),
                    error: error instanceof Error ? error.message : 'Worker connection failed'
                });
            }
        } else {
            // Worker uses same as Root, copy status
            setWorkerProviderStatus({ connected: false, lastCheck: null });
        }

        setTestingConnection(false);
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
                    worker_provider: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerProvider,
                    worker_model: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerModel,

                    // Root params
                    temperature: localSettings.temperature,
                    max_tokens: localSettings.maxTokens,
                    top_p: localSettings.topP,
                    timeout: localSettings.timeout,

                    // Worker params
                    worker_temperature: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerTemperature,
                    worker_max_tokens: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerMaxTokens,
                    worker_top_p: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerTopP,
                    worker_timeout: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerTimeout
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

            // Save resilience config for OpenRouter (Worker), if different from Root
            if (localSettings.workerProvider === 'OpenRouter' && !localSettings.useWorkerSameAsRoot && localSettings.provider !== 'OpenRouter') {
                const resilienceResponse = await fetch('http://127.0.0.1:8000/api/providers/resilience', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: 'openrouter',
                        rate_limit: workerResilienceSettings.rateLimit,
                        retry_enabled: workerResilienceSettings.retryEnabled,
                        fallback_enabled: workerResilienceSettings.fallbackEnabled
                    })
                });

                if (!resilienceResponse.ok) {
                    console.error('Failed to update worker resilience config');
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
    const isModelFree = useCallback((modelId: string, provider: string): boolean => {
        if (provider !== 'OpenRouter' || !modelData?.modelsDetailed) return false;
        const detailed = modelData.modelsDetailed[provider] || [];
        const model = detailed.find(m => m.id === modelId);
        return model?.is_free ?? false;
    }, [modelData]);

    const availableWorkerModels = useMemo(() => {
        if (!modelData || !localSettings.workerProvider) return [];

        let models = modelData.models[localSettings.workerProvider] || [];

        // Filtrage "Modèles gratuits" pour le worker
        if (workerFreeModelsOnly && localSettings.workerProvider === 'OpenRouter' && modelData.modelsDetailed) {
            const detailed = modelData.modelsDetailed['OpenRouter'] || [];
            const freeIds = new Set(detailed.filter(m => m.is_free).map(m => m.id));
            models = models.filter(id => freeIds.has(id));
        }

        return models.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
    }, [modelData, localSettings.workerProvider, workerFreeModelsOnly]);

    const filteredWorkerModels = useMemo(() => {
        const query = workerModelSearchQuery.toLowerCase();
        return availableWorkerModels.filter(m => m.toLowerCase().includes(query));
    }, [availableWorkerModels, workerModelSearchQuery]);

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
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed left-0 top-0 h-full w-full max-w-md bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${currentProviderInfo.color}`}>
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Settings</h2>
                                    <ConnectionIndicator status={providerStatus} />
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">


                            {/* Theme Selection - Removed as requested (moved to sidebar) */}
                            {/* <div className="space-y-3"> ... </div> */}

                            {/* <div className="h-px bg-zinc-800/50" /> */}

                            {/* DUAL LLM SELECTION */}
                            <div className="space-y-6">

                                {/* === ROOT LLM (STRATEGIC) === */}
                                <div className="space-y-3 p-4 border border-border rounded-2xl bg-card/40 relative overflow-hidden group/root">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/root:opacity-100 transition-opacity pointer-events-none" />

                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground">Stratégique (Root)</h3>
                                                <p className="text-[10px] text-muted-foreground">Planification et Raisonnement</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => fetchModels(true, localSettings.provider)}
                                            disabled={loading}
                                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Rafraîchir"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Root Provider Select */}
                                    <div className="relative">
                                        <select
                                            value={localSettings.provider}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, provider: e.target.value }))}
                                            disabled={loading}
                                            className="w-full input-premium appearance-none cursor-pointer text-sm"
                                        >
                                            {loading ? <option>Chargement...</option> : modelData?.providers.map((p) => (
                                                <option key={p} value={p}>{PROVIDER_INFO[p]?.icon || '⚡'} {p}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>

                                    {/* Root Model Select */}
                                    <div className="relative">
                                        <button
                                            onClick={() => {
                                                if (!loading && availableModels.length > 0) setIsModelDropdownOpen(!isModelDropdownOpen);
                                            }}
                                            disabled={loading || availableModels.length === 0}
                                            className="w-full input-premium text-left flex items-center justify-between hover:bg-muted/50 transition-colors text-sm"
                                        >
                                            <span className="truncate">{localSettings.model || "Sélectionner..."}</span>
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isModelDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-60"
                                                    >
                                                        <div className="p-2 border-b border-zinc-800 bg-zinc-900 sticky top-0">
                                                            <input
                                                                type="text"
                                                                placeholder="Rechercher..."
                                                                value={modelSearchQuery}
                                                                onChange={(e) => setModelSearchQuery(e.target.value)}
                                                                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                                            {filteredModels.map((model) => (
                                                                <button
                                                                    key={model}
                                                                    onClick={() => {
                                                                        setLocalSettings(prev => ({ ...prev, model }));
                                                                        setIsModelDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${localSettings.model === model ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
                                                                        }`}
                                                                >
                                                                    {model}
                                                                    {isModelFree(model, localSettings.provider) && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">FREE</span>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                        <div className="relative">
                                            <AnimatePresence>
                                                {isModelDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-60"
                                                        >
                                                            <div className="p-2 border-b border-border bg-popover sticky top-0">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Rechercher..."
                                                                    value={modelSearchQuery}
                                                                    onChange={(e) => setModelSearchQuery(e.target.value)}
                                                                    className="w-full bg-background border border-input rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                                                {filteredModels.map((model) => (
                                                                    <button
                                                                        key={model}
                                                                        onClick={() => {
                                                                            setLocalSettings(prev => ({ ...prev, model }));
                                                                            setIsModelDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${localSettings.model === model ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
                                                                            }`}
                                                                    >
                                                                        {model}
                                                                        {isModelFree(model, localSettings.provider) && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 rounded">FREE</span>}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>




                                        {/* OpenRouter specific settings (Root) */}
                                        {localSettings.provider === 'OpenRouter' && (
                                            <div className="mt-3 space-y-2 pt-3 border-t border-border">
                                                {/* Auto mode toggle */}
                                                <Toggle
                                                    checked={autoModelSelection}
                                                    onChange={(checked) => {
                                                        setAutoModelSelection(checked);
                                                        if (checked) {
                                                            setLocalSettings(prev => ({ ...prev, model: 'openrouter/auto' }));
                                                        } else {
                                                            const models = modelData?.models[localSettings.provider] || [];
                                                            if (models.length > 0) {
                                                                setLocalSettings(prev => ({ ...prev, model: models[0] }));
                                                            }
                                                        }
                                                    }}
                                                    label="Mode Auto"
                                                    icon={<Zap className="w-3 h-3 text-purple-400" />}
                                                    colorClass="bg-purple-600"
                                                />

                                                {/* Free models filter */}
                                                {!autoModelSelection && (
                                                    <Toggle
                                                        checked={freeModelsOnly}
                                                        onChange={setFreeModelsOnly}
                                                        label="Modèles gratuits"
                                                        icon={<Gift className="w-3 h-3 text-emerald-400" />}
                                                        colorClass="bg-emerald-600"
                                                    />
                                                )}

                                                {/* Resilience */}
                                                <ResilienceSection
                                                    settings={resilienceSettings}
                                                    onChange={setResilienceSettings}
                                                />
                                            </div>
                                        )}
                                        {/* Advanced Settings (Root) */}
                                        <div className="pt-2 border-t border-white/10 mt-4">
                                            <button
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span>Paramètres de génération</span>
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {showAdvanced && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-4 pt-2 overflow-hidden"
                                                    >
                                                        <Slider value={localSettings.temperature} onChange={(v) => setLocalSettings(prev => ({ ...prev, temperature: v }))} min={0} max={2} step={0.1} label="Température" icon={<Thermometer className="w-4 h-4" />} />
                                                        <Slider value={localSettings.maxTokens} onChange={(v) => setLocalSettings(prev => ({ ...prev, maxTokens: v }))} min={256} max={32768} step={256} label="Max Tokens" icon={<Hash className="w-4 h-4" />} />
                                                        <Slider value={localSettings.topP} onChange={(v) => setLocalSettings(prev => ({ ...prev, topP: v }))} min={0} max={1} step={0.05} label="Top P" icon={<Sparkles className="w-4 h-4" />} />
                                                        <Slider value={localSettings.timeout} onChange={(v) => setLocalSettings(prev => ({ ...prev, timeout: v }))} min={30} max={600} step={10} label="Timeout" icon={<Clock className="w-4 h-4" />} unit="s" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>


                                    {/* === WORKER TOGGLE === */}
                                    <div className="py-1">
                                        <Toggle
                                            checked={localSettings.useWorkerSameAsRoot}
                                            onChange={(checked) => setLocalSettings(prev => ({ ...prev, useWorkerSameAsRoot: checked }))}
                                            label={
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                        Même modèle pour l'exécution
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        Utiliser le modèle stratégique pour les tâches tactiques
                                                    </span>
                                                </div>
                                            }
                                            colorClass="bg-indigo-600"
                                        />
                                    </div>


                                    {/* === WORKER LLM (TACTICAL) === */}
                                    {!localSettings.useWorkerSameAsRoot && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3 p-4 border border-white/10 rounded-2xl bg-white/5 relative overflow-hidden group/worker"
                                        >
                                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/worker:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-foreground">
                                                        <Zap className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-foreground">Tactique (Worker)</h3>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-muted-foreground">Exécution rapide</p>
                                                            <ConnectionIndicator status={workerProviderStatus} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fetchModels(true, localSettings.workerProvider)}
                                                    disabled={loading}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Rafraîchir"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Worker Provider Select */}
                                            <div className="relative">
                                                <select
                                                    value={localSettings.workerProvider}
                                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, workerProvider: e.target.value }))}
                                                    disabled={loading}
                                                    className="w-full input-premium appearance-none cursor-pointer text-sm"
                                                >
                                                    {loading ? <option>Chargement...</option> : modelData?.providers.map((p) => (
                                                        <option key={p} value={p}>{PROVIDER_INFO[p]?.icon || '⚡'} {p}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            </div>

                                            {/* Worker Model Select */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (!loading && availableWorkerModels.length > 0) setIsWorkerModelDropdownOpen(!isWorkerModelDropdownOpen);
                                                    }}
                                                    disabled={loading || availableWorkerModels.length === 0}
                                                    className="w-full input-premium text-left flex items-center justify-between hover:bg-muted/50 transition-colors text-sm"
                                                >
                                                    <span className="truncate">{localSettings.workerModel || "Sélectionner..."}</span>
                                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isWorkerModelDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {isWorkerModelDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setIsWorkerModelDropdownOpen(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-60"
                                                            >
                                                                <div className="p-2 border-b border-border bg-popover sticky top-0">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Rechercher..."
                                                                        value={workerModelSearchQuery}
                                                                        onChange={(e) => setWorkerModelSearchQuery(e.target.value)}
                                                                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent/50"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                                                    {filteredWorkerModels.map((model) => (
                                                                        <button
                                                                            key={model}
                                                                            onClick={() => {
                                                                                setLocalSettings(prev => ({ ...prev, workerModel: model }));
                                                                                setIsWorkerModelDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${localSettings.workerModel === model ? 'bg-accent/20 text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                                                                                }`}
                                                                        >
                                                                            {model}
                                                                            {isModelFree(model, localSettings.workerProvider || '') && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">FREE</span>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            {/* OpenRouter specific settings (Worker) */}
                                            {localSettings.workerProvider === 'OpenRouter' && (
                                                <div className="mt-3 space-y-2 pt-3 border-t border-border">
                                                    {/* Auto mode toggle */}
                                                    <Toggle
                                                        checked={workerAutoModelSelection}
                                                        onChange={(checked) => {
                                                            setWorkerAutoModelSelection(checked);
                                                            if (checked) {
                                                                setLocalSettings(prev => ({ ...prev, workerModel: 'openrouter/auto' }));
                                                            }
                                                        }}
                                                        label="Mode Auto"
                                                        icon={<Zap className="w-3 h-3 text-amber-400" />}
                                                        colorClass="bg-amber-600"
                                                    />

                                                    {/* Free models filter */}
                                                    {!workerAutoModelSelection && (
                                                        <Toggle
                                                            checked={workerFreeModelsOnly}
                                                            onChange={setWorkerFreeModelsOnly}
                                                            label="Modèles gratuits"
                                                            icon={<Gift className="w-3 h-3 text-emerald-400" />}
                                                            colorClass="bg-emerald-600"
                                                        />
                                                    )}

                                                    {/* Resilience */}
                                                    <ResilienceSection
                                                        settings={workerResilienceSettings}
                                                        onChange={setWorkerResilienceSettings}
                                                        colorClass="text-amber-500"
                                                    />
                                                </div>
                                            )}
                                            {/* Advanced Settings (Worker) */}
                                            <div className="pt-2 border-t border-border mt-4">
                                                <button
                                                    onClick={() => setShowWorkerAdvanced(!showWorkerAdvanced)}
                                                    className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <span>Paramètres de génération</span>
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkerAdvanced ? 'rotate-180' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {showWorkerAdvanced && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="space-y-4 pt-2 overflow-hidden"
                                                        >
                                                            <Slider value={localSettings.workerTemperature ?? 0.7} onChange={(v) => setLocalSettings(prev => ({ ...prev, workerTemperature: v }))} min={0} max={2} step={0.1} label="Température" icon={<Thermometer className="w-4 h-4" />} />
                                                            <Slider value={localSettings.workerMaxTokens ?? 4096} onChange={(v) => setLocalSettings(prev => ({ ...prev, workerMaxTokens: v }))} min={256} max={32768} step={256} label="Max Tokens" icon={<Hash className="w-4 h-4" />} />
                                                            <Slider value={localSettings.workerTopP ?? 1.0} onChange={(v) => setLocalSettings(prev => ({ ...prev, workerTopP: v }))} min={0} max={1} step={0.05} label="Top P" icon={<Sparkles className="w-4 h-4" />} />
                                                            <Slider value={localSettings.workerTimeout ?? 60} onChange={(v) => setLocalSettings(prev => ({ ...prev, workerTimeout: v }))} min={30} max={600} step={10} label="Timeout" icon={<Clock className="w-4 h-4" />} unit="s" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* API Key (if required) */}
                                {currentProviderInfo.requiresKey && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                            <Key className="w-3.5 h-3.5" />
                                            Clé API
                                        </label>
                                        <form className="relative" onSubmit={(e) => e.preventDefault()}>
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                value={localSettings.apiKey || ''}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                                placeholder="sk-..."
                                                className="w-full input-premium pr-12 font-mono text-sm"
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </form>
                                        <p className="text-xs text-muted-foreground">
                                            🔒 Stockée localement de manière chiffrée
                                        </p>
                                    </div>
                                )}



                                {/* Test Connection */}
                                <button
                                    onClick={testConnection}
                                    disabled={testingConnection}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50 border border-input text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    {testingConnection ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Wifi className="w-4 h-4" />
                                    )}
                                    <span>Tester la connexion</span>
                                </button>
                            </div>


                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-border bg-background/5 backdrop-blur-sm space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 glass-button text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Réinitialiser</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${hasChanges
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
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
