import type { SettingsConfig } from '../types/settings';

export const DEFAULT_SETTINGS: SettingsConfig = {
    provider: 'OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: '',
    freeModelsOnly: true,
    useWorkerSameAsRoot: true,
    workerProvider: 'OpenRouter',
    workerModel: 'meta-llama/llama-3.3-70b-instruct:free',
    workerFreeModelsOnly: true,
    workerTemperature: 0.3,
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.9,
    timeout: 800,
    useAuditSameAsRoot: true,
    auditProvider: 'OpenRouter',
    auditModel: 'meta-llama/llama-3.3-70b-instruct:free',
    auditFreeModelsOnly: true,
    auditTemperature: 0.3,
    auditMaxRetries: 3,

    // Resilience - Root defaults
    rateLimit: 15,
    retryEnabled: true,
    fallbackEnabled: true,

    // Resilience - Worker defaults
    workerRateLimit: 15,
    workerRetryEnabled: true,
    workerFallbackEnabled: true,

    // Resilience - Audit defaults
    auditRateLimit: 15,
    auditRetryEnabled: true,
    auditFallbackEnabled: true,

    // System Context - Strategic Agent
    systemContext: "You are the Strategic Architect of AutoLogic.\nYour mission: Orchestrate the resolution of complex problems by coordinating resources and specialized agents.\n\nApproach:\n1. Planning: Analyze the request, break it down into logical steps.\n2. Delegation: Assign technical tasks to appropriate Workers.\n3. Synthesis: Compile results, verify consistency and quality.\n\nPrinciples: Rationality, Precision, Security, Efficiency.",

    reducedMotion: false,
    dyslexicFont: false,
    highContrast: false
};
