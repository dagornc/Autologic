export interface SettingsConfig {
    provider: string;
    model: string;
    apiKey: string;

    // Worker specific configuration
    workerProvider?: string;
    workerModel?: string;
    workerApiKey?: string;
    useWorkerSameAsRoot: boolean;

    // Hyperparameters - Root
    temperature: number;
    maxTokens: number;
    topP: number;
    timeout?: number;

    // Hyperparameters - Worker
    workerTemperature?: number;
    workerMaxTokens?: number;
    workerTopP?: number;
    workerTimeout?: number;

    // Audit specific configuration
    auditProvider?: string;
    auditModel?: string;
    auditApiKey?: string;
    useAuditSameAsRoot: boolean;

    // Hyperparameters - Audit
    auditTemperature?: number;
    auditMaxTokens?: number;
    auditTopP?: number;
    auditTimeout?: number;
    auditMaxRetries: number;
}

export interface ResilienceSettings {
    rateLimit: number;
    retryEnabled: boolean;
    fallbackEnabled: boolean;
}

export interface ProviderStatus {
    connected: boolean;
    lastCheck: Date | null;
    error?: string;
}

export interface ModelData {
    providers: string[];
    models: Record<string, string[]>;
    modelsDetailed?: Record<string, { id: string; is_free: boolean }[]>;
    id: string;
    is_free: boolean;
    defaultParams?: Record<string, { temperature: number; max_tokens: number; top_p: number }>;
    // These match the prompt-focused structure but we can extend if needed
    temperature: number;
    max_tokens: number;
    top_p: number;
}
