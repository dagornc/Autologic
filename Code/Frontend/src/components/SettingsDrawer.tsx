import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Key, Eye, EyeOff,
    Loader2, CheckCircle2, RefreshCw, Wifi, WifiOff,
    Thermometer, Hash, Sparkles, ChevronDown, Save, RotateCcw, Gift, Zap, Shield, Clock,
    Moon, Sun, Monitor
} from 'lucide-react';
import { LiquidBackground } from './ui/LiquidBackground';
import { getStoredTheme, setTheme } from '../utils/theme';
import type { Theme } from '../utils/theme';

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

    // Audit specific params
    auditProvider?: string;
    auditModel?: string;
    useAuditSameAsRoot: boolean;
    auditTemperature?: number;
    auditMaxTokens?: number;
    auditTopP?: number;
    auditTimeout?: number;
    auditMaxRetries: number;
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
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/80 font-medium">
                {icon}
                <span>{label}</span>
            </div>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md min-w-[3rem] text-center border border-primary/20">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-secondary/50 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
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
    <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
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
                className="w-20 input-liquid text-sm text-foreground outline-none font-mono text-right"
            />
            <span className="text-[10px] text-muted-foreground min-w-[30px] uppercase font-bold tracking-wider">{unit}</span>
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
    <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10">
        <div className="relative flex-shrink-0">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-black/20 dark:bg-white/10 rounded-full peer peer-checked:bg-primary transition-all duration-300 border border-white/10`} />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 shadow-sm transition-all duration-300" />
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
        temperature: 0.3,
        maxTokens: 8192,
        topP: 1.0,

        // Worker Params
        workerTemperature: undefined,
        workerMaxTokens: undefined,
        workerTopP: undefined,
        workerTimeout: undefined,

        apiKey: '',
        timeout: 600,

        // Audit Params
        auditProvider: 'OpenRouter',
        auditModel: 'google/gemini-2.0-flash-exp:free',
        useAuditSameAsRoot: true,
        auditTemperature: undefined,
        auditMaxTokens: undefined,
        auditTopP: undefined,
        auditTimeout: undefined,
        auditMaxRetries: 3
    };

    const { settings, saveSettings } = usePersistedSettings(defaultConfig);
    const [localSettings, setLocalSettings] = useState<SettingsConfig>(settings);
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [providerStatus, setProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    const [workerProviderStatus, setWorkerProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    const [auditProviderStatus, setAuditProviderStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
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

    // Audit select state
    const [isAuditModelDropdownOpen, setIsAuditModelDropdownOpen] = useState(false);
    const [auditModelSearchQuery, setAuditModelSearchQuery] = useState('');

    const [freeModelsOnly, setFreeModelsOnly] = useState(true);

    // Worker States
    const [workerResilienceSettings, setWorkerResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
        retryEnabled: true,
        fallbackEnabled: true
    });
    const [workerAutoModelSelection, setWorkerAutoModelSelection] = useState(true);
    const [workerFreeModelsOnly, setWorkerFreeModelsOnly] = useState(true);

    // Audit States
    const [showAuditAdvanced, setShowAuditAdvanced] = useState(false);
    const [auditResilienceSettings, setAuditResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
        retryEnabled: true,
        fallbackEnabled: true
    });
    const [auditAutoModelSelection, setAuditAutoModelSelection] = useState(false);
    const [auditFreeModelsOnly, setAuditFreeModelsOnly] = useState(true);

    const [autoModelSelection, setAutoModelSelection] = useState(() =>
        settings.model === 'openrouter/auto'
    );

    const [currentTheme, setCurrentTheme] = useState<Theme>('system');

    useEffect(() => {
        setCurrentTheme(getStoredTheme());
    }, [isOpen]);

    const handleThemeChange = (theme: Theme) => {
        setTheme(theme);
        setCurrentTheme(theme);
    };

    // Resilience settings state
    const [resilienceSettings, setResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
        retryEnabled: true,
        fallbackEnabled: true
    });

    // State for tracking initial resilience values
    const [originalResilienceSettings, setOriginalResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
        retryEnabled: true,
        fallbackEnabled: true
    });

    const [originalWorkerResilienceSettings, setOriginalWorkerResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
        retryEnabled: true,
        fallbackEnabled: true
    });

    const [originalAuditResilienceSettings, setOriginalAuditResilienceSettings] = useState<ResilienceSettings>({
        rateLimit: 15,
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
                (!localSettings.useWorkerSameAsRoot && localSettings.workerProvider) ? localSettings.workerProvider : null,
                (!localSettings.useAuditSameAsRoot && localSettings.auditProvider) ? localSettings.auditProvider : null
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
    }, [cache, isValid, updateCache, localSettings.apiKey, localSettings.provider, localSettings.workerProvider, localSettings.useWorkerSameAsRoot, localSettings.auditProvider, localSettings.useAuditSameAsRoot]);

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

                        // Audit (using backend naming convention if available, or defaults)
                        auditProvider: data.audit_provider ? normalizeProvider(data.audit_provider) : (activeProvider),
                        auditModel: data.audit_model || data.active_model,
                        useAuditSameAsRoot: !data.audit_provider, // If no audit provider returned, assume fallback to root for now or user hasn't set it

                        temperature: data.temperature,


                        maxTokens: data.max_tokens,
                        topP: data.top_p,
                        timeout: data.timeout,

                        workerTemperature: data.worker_temperature,
                        workerMaxTokens: data.worker_max_tokens,
                        workerTopP: data.worker_top_p,
                        workerTimeout: data.worker_timeout,

                        auditTemperature: data.audit_temperature,
                        auditMaxTokens: data.audit_max_tokens,
                        auditTopP: data.audit_top_p,
                        auditTimeout: data.audit_timeout,
                        auditMaxRetries: data.audit_max_retries ?? 3
                    }));

                    if (data.active_model === 'openrouter/auto') setAutoModelSelection(true);

                    if (data.worker_model === 'openrouter/auto') setWorkerAutoModelSelection(true);
                    if (data.audit_model === 'openrouter/auto') setAuditAutoModelSelection(true);
                })
                .catch(err => console.error("Config fetch error:", err));
        }
    }, [isOpen, settings]);

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [fetchModels, isOpen]);



    // Fetch resilience config for OpenRouter (Root)
    useEffect(() => {
        if (isOpen && localSettings.provider === 'OpenRouter') {
            fetch('http://127.0.0.1:8000/api/providers/openrouter/resilience')
                .then(res => res.json())
                .then(data => {
                    const fetched = {
                        rateLimit: data.rate_limit ?? 15,
                        retryEnabled: data.retry_enabled ?? true,
                        fallbackEnabled: data.fallback_enabled ?? true
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
            fetch('http://127.0.0.1:8000/api/providers/openrouter_worker/resilience')
                .then(res => res.json())
                .then(data => {
                    const fetched = {
                        rateLimit: data.rate_limit ?? 15,
                        retryEnabled: data.retry_enabled ?? true,
                        fallbackEnabled: data.fallback_enabled ?? true
                    };
                    setWorkerResilienceSettings(fetched);
                    setOriginalWorkerResilienceSettings(fetched);
                })
                .catch(err => console.warn('Failed to fetch worker resilience config:', err));
        }
    }, [isOpen, localSettings.workerProvider, localSettings.useWorkerSameAsRoot]);

    // Fetch resilience config for OpenRouter (Audit)
    useEffect(() => {
        if (isOpen && localSettings.auditProvider === 'OpenRouter' && !localSettings.useAuditSameAsRoot) {
            fetch('http://127.0.0.1:8000/api/providers/openrouter_audit/resilience')
                .then(res => res.json())
                .then(data => {
                    const fetched = {
                        rateLimit: data.rate_limit ?? 15,
                        retryEnabled: data.retry_enabled ?? true,
                        fallbackEnabled: data.fallback_enabled ?? true
                    };
                    setAuditResilienceSettings(fetched);
                    setOriginalAuditResilienceSettings(fetched);
                })
                .catch(err => console.warn('Failed to fetch audit resilience config:', err));
        }
    }, [isOpen, localSettings.auditProvider, localSettings.useAuditSameAsRoot]);

    // Track changes
    useEffect(() => {
        const isSettingsChanged = JSON.stringify(localSettings) !== JSON.stringify(settings);
        const isResilienceChanged = JSON.stringify(resilienceSettings) !== JSON.stringify(originalResilienceSettings);
        // Track worker resilience changes (only if applicable, but simple check is okay as user editing it implies intent)
        const isWorkerResilienceChanged = JSON.stringify(workerResilienceSettings) !== JSON.stringify(originalWorkerResilienceSettings);
        const isAuditResilienceChanged = JSON.stringify(auditResilienceSettings) !== JSON.stringify(originalAuditResilienceSettings);

        setHasChanges(isSettingsChanged || isResilienceChanged || isWorkerResilienceChanged || isAuditResilienceChanged);
    }, [localSettings, settings, resilienceSettings, originalResilienceSettings, workerResilienceSettings, originalWorkerResilienceSettings, auditResilienceSettings, originalAuditResilienceSettings]);

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
                    setLocalSettings(prev => ({ ...prev, workerModel: models[0] }));
                }
            }
            // Audit
            if (!localSettings.useAuditSameAsRoot && localSettings.auditProvider) {
                const models = modelData.models[localSettings.auditProvider] || [];
                const currentAuditModel = localSettings.auditModel || '';
                if (models.length > 0 && (!currentAuditModel || !models.includes(currentAuditModel))) {
                    setLocalSettings(prev => ({ ...prev, auditModel: models[0] }));
                }
            }
        }
    }, [localSettings.provider, localSettings.workerProvider, localSettings.auditProvider, modelData, localSettings.useWorkerSameAsRoot, localSettings.useAuditSameAsRoot, localSettings.model, localSettings.workerModel, localSettings.auditModel]);

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

        // Test Audit provider if separate
        if (!localSettings.useAuditSameAsRoot && localSettings.auditProvider) {
            try {
                const auditResponse = await fetch('http://127.0.0.1:8000/api/providers/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: localSettings.auditProvider,
                        api_key: localSettings.apiKey
                    })
                });

                if (auditResponse.ok) {
                    setAuditProviderStatus({
                        connected: true,
                        lastCheck: new Date(),
                        error: undefined
                    });
                } else {
                    const errorData = await auditResponse.json().catch(() => ({}));
                    setAuditProviderStatus({
                        connected: false,
                        lastCheck: new Date(),
                        error: errorData.detail || `Status: ${auditResponse.status}`
                    });
                }
            } catch (error) {
                setAuditProviderStatus({
                    connected: false,
                    lastCheck: new Date(),
                    error: error instanceof Error ? error.message : 'Audit connection failed'
                });
            }
        } else {
            setAuditProviderStatus({ connected: false, lastCheck: null });
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

                    worker_timeout: localSettings.useWorkerSameAsRoot ? undefined : localSettings.workerTimeout,

                    // Audit params
                    audit_provider: localSettings.useAuditSameAsRoot ? undefined : localSettings.auditProvider,
                    audit_model: localSettings.useAuditSameAsRoot ? undefined : localSettings.auditModel,
                    audit_temperature: localSettings.useAuditSameAsRoot ? undefined : localSettings.auditTemperature,
                    audit_max_tokens: localSettings.useAuditSameAsRoot ? undefined : localSettings.auditMaxTokens,
                    audit_top_p: localSettings.useAuditSameAsRoot ? undefined : localSettings.auditTopP,
                    audit_timeout: localSettings.auditTimeout,
                    audit_max_retries: localSettings.auditMaxRetries
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
            if (localSettings.workerProvider === 'OpenRouter' && !localSettings.useWorkerSameAsRoot) {
                const resilienceResponse = await fetch('http://127.0.0.1:8000/api/providers/resilience', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: 'openrouter_worker',
                        rate_limit: workerResilienceSettings.rateLimit,
                        retry_enabled: workerResilienceSettings.retryEnabled,
                        fallback_enabled: workerResilienceSettings.fallbackEnabled
                    })
                });

                if (!resilienceResponse.ok) {
                    console.error('Failed to update worker resilience config');
                }
            }

            // Save resilience config for OpenRouter (Audit), if different from Root
            if (localSettings.auditProvider === 'OpenRouter' && !localSettings.useAuditSameAsRoot) {
                const resilienceResponse = await fetch('http://127.0.0.1:8000/api/providers/resilience', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: 'openrouter_audit',
                        rate_limit: auditResilienceSettings.rateLimit,
                        retry_enabled: auditResilienceSettings.retryEnabled,
                        fallback_enabled: auditResilienceSettings.fallbackEnabled
                    })
                });

                if (!resilienceResponse.ok) {
                    console.error('Failed to update audit resilience config');
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

    const availableAuditModels = useMemo(() => {
        if (!modelData || !localSettings.auditProvider) return [];

        let models = modelData.models[localSettings.auditProvider] || [];

        // Filtrage "Modèles gratuits" pour l'audit
        if (auditFreeModelsOnly && localSettings.auditProvider === 'OpenRouter' && modelData.modelsDetailed) {
            const detailed = modelData.modelsDetailed['OpenRouter'] || [];
            const freeIds = new Set(detailed.filter(m => m.is_free).map(m => m.id));
            models = models.filter(id => freeIds.has(id));
        }

        return models.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
    }, [modelData, localSettings.auditProvider, auditFreeModelsOnly]);

    const filteredAuditModels = useMemo(() => {
        const query = auditModelSearchQuery.toLowerCase();
        return availableAuditModels.filter(m => m.toLowerCase().includes(query));
    }, [availableAuditModels, auditModelSearchQuery]);

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
                        className="fixed left-0 top-0 h-full w-full max-w-md glass-panel-next z-50 overflow-hidden flex flex-col"
                    >
                        <LiquidBackground className="opacity-50" />

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


                            {/* Theme Selection */}
                            <div className="p-1 bg-secondary/50 backdrop-blur-md rounded-2xl flex items-center justify-between border border-border/50">
                                {[
                                    { id: 'light', icon: Sun, label: 'Light' },
                                    { id: 'dark', icon: Moon, label: 'Dark' },
                                    { id: 'system', icon: Monitor, label: 'System' },
                                ].map((theme) => {
                                    const isActive = currentTheme === theme.id;
                                    const Icon = theme.icon;
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleThemeChange(theme.id as Theme)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-300 ${isActive
                                                ? 'bg-background shadow-sm text-primary scale-100'
                                                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground scale-95 hover:scale-100'
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{theme.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-muted-foreground">Planification et Raisonnement</p>
                                                    <ConnectionIndicator status={providerStatus} />
                                                </div>
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
                                            className="w-full input-liquid appearance-none cursor-pointer text-sm font-medium"
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
                                            className="w-full input-liquid text-left flex items-center justify-between hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-sm font-medium"
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
                                                        <Slider value={localSettings.timeout} onChange={(v) => setLocalSettings(prev => ({ ...prev, timeout: v }))} min={30} max={800} step={10} label="Timeout" icon={<Clock className="w-4 h-4" />} unit="s" />
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
                                                    className="w-full input-liquid font-medium appearance-none cursor-pointer text-sm"
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
                                                    className="w-full input-liquid font-medium text-left flex items-center justify-between hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-sm"
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
                                                            <Slider value={localSettings.workerTimeout ?? 60} onChange={(v) => setLocalSettings(prev => ({ ...prev, workerTimeout: v }))} min={30} max={800} step={10} label="Timeout" icon={<Clock className="w-4 h-4" />} unit="s" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* === AUDIT TOGGLE === */}
                                    <div className="py-1">
                                        <Toggle
                                            checked={localSettings.useAuditSameAsRoot}
                                            onChange={(checked) => setLocalSettings(prev => ({ ...prev, useAuditSameAsRoot: checked }))}
                                            label={
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                        Même modèle pour l'audit
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        Utiliser le modèle stratégique pour les critiques/audits
                                                    </span>
                                                </div>
                                            }
                                            colorClass="bg-fuchsia-600"
                                        />
                                    </div>

                                    {/* === AUDIT LLM (OBSERVER) === */}
                                    {!localSettings.useAuditSameAsRoot && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3 p-4 border border-white/10 rounded-2xl bg-white/5 relative overflow-hidden group/audit"
                                        >
                                            <div className="absolute inset-0 bg-fuchsia-500/5 opacity-0 group-hover/audit:opacity-100 transition-opacity pointer-events-none" />

                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-foreground">Audit (Observer)</h3>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-muted-foreground">Validation et critique</p>
                                                            <ConnectionIndicator status={auditProviderStatus} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fetchModels(true, localSettings.auditProvider)}
                                                    disabled={loading}
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Rafraîchir"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Audit Provider Select */}
                                            <div className="relative">
                                                <select
                                                    value={localSettings.auditProvider}
                                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, auditProvider: e.target.value }))}
                                                    disabled={loading}
                                                    className="w-full input-premium appearance-none cursor-pointer text-sm"
                                                >
                                                    {loading ? <option>Chargement...</option> : modelData?.providers.map((p) => (
                                                        <option key={p} value={p}>{PROVIDER_INFO[p]?.icon || '⚡'} {p}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            </div>

                                            {/* Audit Model Select */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (!loading && availableAuditModels.length > 0) setIsAuditModelDropdownOpen(!isAuditModelDropdownOpen);
                                                    }}
                                                    disabled={loading || availableAuditModels.length === 0}
                                                    className="w-full input-premium text-left flex items-center justify-between hover:bg-muted/50 transition-colors text-sm"
                                                >
                                                    <span className="truncate">{localSettings.auditModel || "Sélectionner..."}</span>
                                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isAuditModelDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {isAuditModelDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setIsAuditModelDropdownOpen(false)} />
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
                                                                        value={auditModelSearchQuery}
                                                                        onChange={(e) => setAuditModelSearchQuery(e.target.value)}
                                                                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-fuchsia-500/50"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                                                    {filteredAuditModels.map((model) => (
                                                                        <button
                                                                            key={model}
                                                                            onClick={() => {
                                                                                setLocalSettings(prev => ({ ...prev, auditModel: model }));
                                                                                setIsAuditModelDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate ${localSettings.auditModel === model ? 'bg-fuchsia-500/20 text-fuchsia-500' : 'text-muted-foreground hover:bg-muted'
                                                                                }`}
                                                                        >
                                                                            {model}
                                                                            {isModelFree(model, localSettings.auditProvider || '') && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">FREE</span>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* OpenRouter specific settings (Audit) */}
                                            {localSettings.auditProvider === 'OpenRouter' && (
                                                <div className="mt-3 space-y-2 pt-3 border-t border-border">
                                                    {/* Auto mode toggle */}
                                                    <Toggle
                                                        checked={auditAutoModelSelection}
                                                        onChange={(checked) => {
                                                            setAuditAutoModelSelection(checked);
                                                            if (checked) {
                                                                setLocalSettings(prev => ({ ...prev, auditModel: 'openrouter/auto' }));
                                                            }
                                                        }}
                                                        label="Mode Auto"
                                                        icon={<Zap className="w-3 h-3 text-fuchsia-400" />}
                                                        colorClass="bg-fuchsia-600"
                                                    />

                                                    {/* Free models filter */}
                                                    {!auditAutoModelSelection && (
                                                        <Toggle
                                                            checked={auditFreeModelsOnly}
                                                            onChange={setAuditFreeModelsOnly}
                                                            label="Modèles gratuits"
                                                            icon={<Gift className="w-3 h-3 text-emerald-400" />}
                                                            colorClass="bg-emerald-600"
                                                        />
                                                    )}

                                                    {/* Resilience */}
                                                    <ResilienceSection
                                                        settings={auditResilienceSettings}
                                                        onChange={setAuditResilienceSettings}
                                                        colorClass="text-fuchsia-500"
                                                    />
                                                </div>
                                            )}

                                        </motion.div>
                                    )}

                                    {/* Advanced Settings (Audit) - Always accessible for Process Params */}
                                    <div className="pt-2 border-t border-border mt-4">
                                        <button
                                            onClick={() => setShowAuditAdvanced(!showAuditAdvanced)}
                                            className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <span>Paramètres de génération & Processus</span>
                                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAuditAdvanced ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {showAuditAdvanced && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="space-y-4 pt-2 overflow-hidden"
                                                >
                                                    {/* Model Params - Only if custom model */}
                                                    {!localSettings.useAuditSameAsRoot && (
                                                        <>
                                                            <Slider value={localSettings.auditTemperature ?? 0.7} onChange={(v) => setLocalSettings(prev => ({ ...prev, auditTemperature: v }))} min={0} max={2} step={0.1} label="Température" icon={<Thermometer className="w-4 h-4" />} />
                                                            <Slider value={localSettings.auditMaxTokens ?? 4096} onChange={(v) => setLocalSettings(prev => ({ ...prev, auditMaxTokens: v }))} min={256} max={32768} step={256} label="Max Tokens" icon={<Hash className="w-4 h-4" />} />
                                                            <Slider value={localSettings.auditTopP ?? 1.0} onChange={(v) => setLocalSettings(prev => ({ ...prev, auditTopP: v }))} min={0} max={1} step={0.05} label="Top P" icon={<Sparkles className="w-4 h-4" />} />
                                                        </>
                                                    )}

                                                    {/* Process Params - Always visible */}
                                                    <div className="pt-2 border-t border-white/5">
                                                        <p className="text-[10px] text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Processus d'Audit</p>
                                                        <Slider value={localSettings.auditTimeout ?? 30} onChange={(v) => setLocalSettings(prev => ({ ...prev, auditTimeout: v }))} min={30} max={800} step={10} label="Max Audit Duration" icon={<Clock className="w-4 h-4" />} unit="s" />
                                                        <Slider value={localSettings.auditMaxRetries ?? 3} onChange={(v) => setLocalSettings(prev => ({ ...prev, auditMaxRetries: v }))} min={1} max={10} step={1} label="Max Audit Pass" icon={<RotateCcw className="w-4 h-4" />} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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
            )
            }
        </AnimatePresence >
    );
};

export default SettingsDrawer;
