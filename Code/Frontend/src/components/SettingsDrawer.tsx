import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Key, Eye, EyeOff,
    CheckCircle2, RefreshCw, Cpu, Shield,
    Brain, Zap, Moon, Sun, Monitor, AlertTriangle
} from 'lucide-react';
import { LiquidBackground } from './ui/LiquidBackground';
import { getStoredTheme, setTheme } from '../utils/theme';
import type { Theme } from '../utils/theme';
import type { SettingsConfig, ProviderStatus } from '../types/settings';
import { useModelCache, usePersistedSettings } from '../hooks/useSettings';
import { SettingsSlider } from './ui/settings/SettingsSlider';
import { SettingsNumberInput } from './ui/settings/SettingsNumberInput';
import { SettingsToggle } from './ui/settings/SettingsToggle';
import { ConnectionIndicator } from './ui/settings/ConnectionIndicator';
import { ResilienceSection } from './ui/settings/ResilienceSection';
import { api } from '../services/api';

// ============ TYPES ============
interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: SettingsConfig) => void;
}

// ============ CONSTANTS ============
const PROVIDER_INFO: Record<string, { color: string; icon: string; requiresKey: boolean }> = {
    OpenRouter: { color: 'from-indigo-600 to-purple-600', icon: '⚡', requiresKey: true },
    OpenAI: { color: 'from-green-600 to-emerald-600', icon: '🤖', requiresKey: true },
    Anthropic: { color: 'from-orange-600 to-amber-600', icon: '🧠', requiresKey: true },
    Google: { color: 'from-blue-500 to-red-500', icon: '🌐', requiresKey: true },
    Mistral: { color: 'from-yellow-400 to-orange-500', icon: '🌬️', requiresKey: true },
    Groq: { color: 'from-orange-500 to-red-600', icon: '🚀', requiresKey: true },
    Ollama: { color: 'from-gray-600 to-gray-800', icon: '🦙', requiresKey: false },
    LMStudio: { color: 'from-blue-600 to-cyan-600', icon: '🖥️', requiresKey: false },
    vLLM: { color: 'from-blue-600 to-indigo-600', icon: '🚀', requiresKey: true },
    HuggingFace: { color: 'from-yellow-500 to-orange-600', icon: '🤗', requiresKey: true },
};

const DEFAULT_CONFIG: SettingsConfig = {
    provider: 'OpenRouter',
    model: 'google/gemini-2.0-flash-exp:free',
    apiKey: '',
    useWorkerSameAsRoot: true,
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.9,
    timeout: 800,
    useAuditSameAsRoot: true,
    auditMaxRetries: 3,
    rateLimit: 60,
    retryEnabled: true,
    fallbackEnabled: true
};

// ============ MAIN COMPONENT ============
const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, onConfigChange }) => {
    // --- State & Hooks ---
    const [config, setConfig, loaded] = usePersistedSettings(DEFAULT_CONFIG);
    const { models: modelData, loading: loadingModels, fetchModels } = useModelCache();

    // UI State
    const [activeTab, setActiveTab] = useState<'general' | 'strategic' | 'tactical' | 'audit'>('general');
    const [showKey, setShowKey] = useState(false);
    const [showWorkerKey, setShowWorkerKey] = useState(false);
    const [showAuditKey, setShowAuditKey] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ProviderStatus>({ connected: false, lastCheck: null });
    // const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme()); // Removed unused
    const [localTheme, setLocalTheme] = useState<Theme>(getStoredTheme());

    // --- Effects ---
    useEffect(() => {
        if (isOpen) {
            fetchModels();
            // Reset local theme state to match system when opening
            setLocalTheme(getStoredTheme());
        }
    }, [isOpen, fetchModels]);

    useEffect(() => {
        if (loaded) {
            onConfigChange(config);
        }
    }, [config, loaded, onConfigChange]);

    // --- Handlers ---
    const handleThemeChange = (theme: Theme) => {
        setTheme(theme);
        // setCurrentTheme(theme); // Removed unused state
        setLocalTheme(theme);
    };

    const normalizeProvider = (p: string) => {
        const lower = p.toLowerCase();
        const map: Record<string, string> = {
            'openrouter': 'OpenRouter',
            'openai': 'OpenAI',
            'anthropic': 'Anthropic',
            'google': 'Google',
            'mistral': 'Mistral',
            'groq': 'Groq',
            'ollama': 'Ollama',
            'lmstudio': 'LMStudio',
            'vllm': 'vLLM',
            'huggingface': 'HuggingFace'
        };
        return map[lower] || p;
    };

    const getAvailableModels = (provider: string, isFreeOnly: boolean = false) => {
        if (!modelData || !modelData.models) return [];
        const normProvider = normalizeProvider(provider);
        let models = modelData.models[normProvider] || [];

        // Filter free models if requested (OpenRouter specific usually)
        if (isFreeOnly && modelData.modelsDetailed && modelData.modelsDetailed[normProvider]) {
            models = modelData.modelsDetailed[normProvider]
                .filter(m => m.is_free)
                .map(m => m.id);
        }
        return models;
    };

    const testConnection = async () => {
        setIsTestingConnection(true);
        try {
            // Test Root Provider
            // Test Root Provider
            const rootRes = await api.testConnection();

            if (!rootRes.success) throw new Error(rootRes.error || 'Connection failed');

            // Test Worker (if different)
            if (!config.useWorkerSameAsRoot) {
                const workerRes = await api.testConnection();
                if (!workerRes.success) throw new Error(`Worker: ${workerRes.error}`);
            }

            // Test Audit (if different)
            if (!config.useAuditSameAsRoot) {
                const auditRes = await api.testConnection();
                if (!auditRes.success) throw new Error(`Audit: ${auditRes.error}`);
            }

            setConnectionStatus({ connected: true, lastCheck: new Date() });

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown connection error';
            setConnectionStatus({
                connected: false,
                lastCheck: new Date(),
                error: errorMessage
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    // --- Render Helpers ---

    const renderProviderSelector = (
        currentProvider: string,
        onChange: (p: string) => void,
        showKeyInput: boolean,
        apiKey: string,
        onKeyChange: (k: string) => void,
        keyVisible: boolean,
        toggleKeyVisible: () => void
    ) => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`
                            relative overflow-hidden group p-3 rounded-xl border text-left transition-all duration-300
                            ${currentProvider === key
                                ? 'bg-white/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                            }
                        `}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-xl">{info.icon}</span>
                            <span className="text-xs font-medium text-white/90">{key}</span>
                        </div>
                    </button>
                ))}
            </div>

            {showKeyInput && PROVIDER_INFO[currentProvider]?.requiresKey && (
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type={keyVisible ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => onKeyChange(e.target.value)}
                        placeholder={`Enter ${currentProvider} API Key`}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all placeholder:text-white/20"
                    />
                    <button
                        onClick={toggleKeyVisible}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/80 transition-colors"
                    >
                        {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            )}
        </div>
    );

    const renderModelSelector = (
        currentProvider: string,
        currentModel: string,
        onModelChange: (m: string) => void,
        label: string = "Model"
    ) => {
        const availableModels = getAvailableModels(currentProvider);

        return (
            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60 ml-1">{label}</label>
                <div className="relative">
                    <select
                        value={currentModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        disabled={loadingModels}
                        className="w-full appearance-none bg-black/20 border border-white/10 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    >
                        {loadingModels ? (
                            <option>Loading models...</option>
                        ) : availableModels.length > 0 ? (
                            availableModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))
                        ) : (
                            <option value={currentModel}>{currentModel}</option>
                        )}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {loadingModels ? (
                            <RefreshCw className="h-4 w-4 text-white/40 animate-spin" />
                        ) : (
                            <Settings className="h-4 w-4 text-white/40" /> // Using Settings icon as chevron substitute
                        )}
                    </div>
                </div>
                {/* Fallback check */}
                {availableModels.length === 0 && !loadingModels && (
                    <p className="text-xs text-amber-500/80 flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        No models found. Check API key or connection.
                    </p>
                )}
            </div>
        );
    };

    // --- Tab Content ---

    const GeneralContent = () => (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    Appearance
                </h3>
                <div className="flex bg-black/30 p-1 rounded-lg">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => handleThemeChange(t)}
                            className={`
                                flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all
                                ${localTheme === t
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                }
                            `}
                        >
                            {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                            {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                            {t === 'system' && <Monitor className="w-3.5 h-3.5" />}
                            <span className="capitalize">{t}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const StrategicContent = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <Brain className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white/90">Strategic Planner (Root)</h3>
                    <p className="text-xs text-white/50">High-level reasoning and orchestration</p>
                </div>
            </div>

            {renderProviderSelector(
                config.provider,
                (p) => setConfig({ ...config, provider: p }),
                true,
                config.apiKey,
                (k) => setConfig({ ...config, apiKey: k }),
                showKey,
                () => setShowKey(!showKey)
            )}

            {renderModelSelector(
                config.provider,
                config.model,
                (m) => setConfig({ ...config, model: m })
            )}

            <div className="border-t border-white/10 my-6" />

            <SettingsSlider
                label="Creativity (Temperature)"
                value={config.temperature}
                onChange={(v) => setConfig({ ...config, temperature: v })}
                min={0} max={2} step={0.1}
                icon={Zap}
                description="Higher values make output more random, lower values more deterministic."
            />

            <SettingsNumberInput
                label="Context Window (Tokens)"
                value={config.maxTokens}
                onChange={(v) => setConfig({ ...config, maxTokens: v })}
                icon={Cpu}
                unit=" tks"
            />

            <SettingsNumberInput
                label="Timeout (Seconds)"
                value={config.timeout}
                onChange={(v) => setConfig({ ...config, timeout: v })}
                icon={Clock}
                unit=" s"
                max={800}
            />

            <ResilienceSection
                settings={{
                    rateLimit: config.rateLimit,
                    retryEnabled: config.retryEnabled,
                    fallbackEnabled: config.fallbackEnabled
                }}
                onChange={(newRes) => setConfig({
                    ...config,
                    rateLimit: newRes.rateLimit,
                    retryEnabled: newRes.retryEnabled,
                    fallbackEnabled: newRes.fallbackEnabled
                })}
            />
        </div>
    );

    const TacticalContent = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Cpu className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white/90">Tactical Executor (Worker)</h3>
                    <p className="text-xs text-white/50">Task execution and implementation</p>
                </div>
            </div>

            <SettingsToggle
                checked={config.useWorkerSameAsRoot}
                onChange={(v) => setConfig({ ...config, useWorkerSameAsRoot: v })}
                label="Use same configuration as Strategic"
                icon={RefreshCw}
            />

            {!config.useWorkerSameAsRoot && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-2"
                >
                    {renderProviderSelector(
                        config.workerProvider || config.provider,
                        (p) => setConfig({ ...config, workerProvider: p }),
                        true,
                        config.workerApiKey || '',
                        (k) => setConfig({ ...config, workerApiKey: k }),
                        showWorkerKey,
                        () => setShowWorkerKey(!showWorkerKey)
                    )}

                    {renderModelSelector(
                        config.workerProvider || config.provider,
                        config.workerModel || config.model,
                        (m) => setConfig({ ...config, workerModel: m })
                    )}

                    <div className="border-t border-white/10 my-4" />

                    <SettingsSlider
                        label="Creativity (Temperature)"
                        value={config.workerTemperature ?? config.temperature}
                        onChange={(v) => setConfig({ ...config, workerTemperature: v })}
                        min={0} max={2} step={0.1}
                        icon={Zap}
                    />

                    <SettingsNumberInput
                        label="Context Window"
                        value={config.workerMaxTokens ?? config.maxTokens}
                        onChange={(v) => setConfig({ ...config, workerMaxTokens: v })}
                        icon={Cpu}
                        unit=" tks"
                    />
                    <SettingsNumberInput
                        label="Timeout"
                        value={config.workerTimeout ?? config.timeout ?? 800}
                        onChange={(v) => setConfig({ ...config, workerTimeout: v })}
                        icon={Clock}
                        unit=" s"
                        max={800}
                    />
                </motion.div>
            )}
        </div>
    );

    const AuditContent = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-white/90">Audit & Validation</h3>
                    <p className="text-xs text-white/50">Quality control and self-correction</p>
                </div>
            </div>

            <SettingsToggle
                checked={config.useAuditSameAsRoot}
                onChange={(v) => setConfig({ ...config, useAuditSameAsRoot: v })}
                label="Use same configuration as Strategic"
                icon={RefreshCw}
            />

            {!config.useAuditSameAsRoot && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-2"
                >
                    {renderProviderSelector(
                        config.auditProvider || config.provider,
                        (p) => setConfig({ ...config, auditProvider: p }),
                        true,
                        config.auditApiKey || '',
                        (k) => setConfig({ ...config, auditApiKey: k }),
                        showAuditKey,
                        () => setShowAuditKey(!showAuditKey)
                    )}

                    {renderModelSelector(
                        config.auditProvider || config.provider,
                        config.auditModel || config.model,
                        (m) => setConfig({ ...config, auditModel: m })
                    )}

                    <div className="border-t border-white/10 my-4" />

                    <SettingsSlider
                        label="Creativity (Temperature)"
                        value={config.auditTemperature ?? config.temperature}
                        onChange={(v) => setConfig({ ...config, auditTemperature: v })}
                        min={0} max={2} step={0.1}
                        icon={Zap}
                    />
                    <SettingsNumberInput
                        label="Timeout"
                        value={config.auditTimeout ?? config.timeout ?? 800}
                        onChange={(v) => setConfig({ ...config, auditTimeout: v })}
                        icon={Clock}
                        unit=" s"
                        max={800}
                    />
                </motion.div>
            )}

            <div className="border-t border-white/10 my-6" />

            <SettingsNumberInput
                label="Max Audit Retries"
                value={config.auditMaxRetries}
                onChange={(v) => setConfig({ ...config, auditMaxRetries: v })}
                min={0} max={10}
                icon={Shield}
            />
        </div>
    );

    // --- Main Render ---

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Dynamic Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                            <LiquidBackground />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                            <div>
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    Système & Configuration
                                </h2>
                                <p className="text-xs text-white/40 font-mono mt-1">v2.0.4 • Stable</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ConnectionIndicator status={connectionStatus} showLoading={isTestingConnection} />
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="relative z-10 px-6 py-4 flex gap-2 border-b border-white/5 overflow-x-auto no-scrollbar">
                            {(['general', 'strategic', 'tactical', 'audit'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                       px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                       ${activeTab === tab
                                            ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10'
                                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                        }
                                   `}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Content Scroll Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto p-6 scroll-smooth">
                            {activeTab === 'general' && <GeneralContent />}
                            {activeTab === 'strategic' && <StrategicContent />}
                            {activeTab === 'tactical' && <TacticalContent />}
                            {activeTab === 'audit' && <AuditContent />}

                            {/* Actions Footer within scroll to ensure it doesn't overlap on small screens? No, better fixed. */}
                        </div>

                        {/* Fixed Footer */}
                        <div className="relative z-10 p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl flex justify-between items-center gap-4">
                            <button
                                onClick={testConnection}
                                disabled={isTestingConnection}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all font-medium text-sm disabled:opacity-50"
                            >
                                {isTestingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Test Connection
                            </button>

                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Temp imports for icons not yet imported
import { Clock } from 'lucide-react';

export default SettingsDrawer;
