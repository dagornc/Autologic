/**
 * Couche API centralisée pour AutoLogic
 */

import type { AutoLogicResult, ModelData, LLMConfig, Prompt, PromptCreate, PromptUpdate, ReasoningPlan } from '../types';

/** Types pour les événements SSE */
export interface SSEProgressEvent {
    type: 'progress';
    stage: string;
    status: string;
    message?: string;
    model?: string;
}

export interface SSEResultEvent {
    type: 'result';
    payload: AutoLogicResult;
}

export interface SSEErrorEvent {
    type: 'error';
    message: string;
}

export type SSEEvent = SSEProgressEvent | SSEResultEvent | SSEErrorEvent;

/**
 * URL de base de l'API backend.
 *
 * Priorité de configuration :
 * 1. Variable d'environnement VITE_API_URL (définie dans .env ou .env.production)
 * 2. Fallback sur localhost:8000 pour le développement
 *
 * Exemples de configuration .env :
 *   VITE_API_URL=http://127.0.0.1:8000      (développement local)
 *   VITE_API_URL=https://api.autologic.com  (production)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/** Timeout par défaut pour les requêtes (120 secondes) */
const DEFAULT_TIMEOUT = 120000;

/**
 * Erreur personnalisée pour les erreurs API
 */
export class ApiError extends Error {
    statusCode?: number;
    details?: unknown;

    constructor(
        message: string,
        statusCode?: number,
        details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Exécute une requête fetch avec timeout
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = DEFAULT_TIMEOUT,
    externalSignal?: AbortSignal
): Promise<Response> {
    const controller = new AbortController();

    // Si un signal externe est fourni, on écoute son événement abort
    if (externalSignal) {
        externalSignal.addEventListener('abort', () => controller.abort());
    }

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            // En fait, fetch ne prend qu'un seul signal.
            // Si on veut supporter les deux (timeout interne ET abort externe), il faut une logique plus complexe.
            // Simplification : On utilise le signal du controller interne, et on l'abort si le signal externe abort.
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
        if (externalSignal) {
            externalSignal.removeEventListener('abort', () => controller.abort());
        }
    }
}

/**
 * Service API pour les opérations de raisonnement
 */
export const reasoningApi = {
    /**
     * Exécute le cycle complet de raisonnement
     */
    async solveFull(task: string, config?: LLMConfig, signal?: AbortSignal): Promise<AutoLogicResult> {
        // Utilise le timeout de la config (en secondes) ou le défaut (120s)
        const timeoutMs = config?.timeout ? config.timeout * 1000 : DEFAULT_TIMEOUT;

        const response = await fetchWithTimeout(
            `${API_BASE_URL}/reason/full`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task,
                    parameters: config ? {
                        provider: config.provider,
                        model: config.model,
                        api_key: config.apiKey,
                        timeout: config.timeout,
                        audit_max_retries: config.auditMaxRetries,
                        retry_enabled: config.retryEnabled,
                        fallback_enabled: config.fallbackEnabled,
                        rate_limit: config.rateLimit,
                        retry_base_delay: config.retryBaseDelay,

                        // Worker Resilience
                        workerRateLimit: config.workerRateLimit,
                        workerRetryEnabled: config.workerRetryEnabled,
                        workerFallbackEnabled: config.workerFallbackEnabled,

                        // Audit Resilience
                        auditRateLimit: config.auditRateLimit,
                        auditRetryEnabled: config.auditRetryEnabled,
                        auditFallbackEnabled: config.auditFallbackEnabled
                    } : {},
                }),
            },
            timeoutMs,
            signal
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.detail || `Server Error: ${response.status}`,
                response.status,
                errorData
            );
        }

        return response.json();
    },

    /**
     * Exécute le cycle en streaming (SSE)
     */
    async solveStream(
        task: string,
        config: LLMConfig | undefined,
        onEvent: (event: SSEEvent) => void,
        onError: (error: Error) => void,
        signal?: AbortSignal
    ): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/reason/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task,
                parameters: config ? {
                    provider: config.provider,
                    model: config.model,
                    api_key: config.apiKey,
                    timeout: config.timeout,
                    audit_max_retries: config.auditMaxRetries,
                    retry_enabled: config.retryEnabled,
                    fallback_enabled: config.fallbackEnabled,
                    rate_limit: config.rateLimit,
                    retry_base_delay: config.retryBaseDelay,

                    // Worker Resilience
                    workerRateLimit: config.workerRateLimit,
                    workerRetryEnabled: config.workerRetryEnabled,
                    workerFallbackEnabled: config.workerFallbackEnabled,

                    // Audit Resilience
                    auditRateLimit: config.auditRateLimit,
                    auditRetryEnabled: config.auditRetryEnabled,
                    auditFallbackEnabled: config.auditFallbackEnabled
                } : {},
            }),
            signal
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new ApiError(error.detail || 'Stream failed', response.status);
        }

        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Keep the incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            onEvent(data);
                        } catch (e) {
                            console.error('SSE Parse Error:', e);
                        }
                    }
                }
            }
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            if (error.name !== 'AbortError') {
                onError(error);
            }
        }
    },

    /**
     * Récupère la liste des modules de raisonnement
     */
    async getModules(): Promise<{ modules: Array<{ id: string; name: string; description: string; category: string }> }> {
        const response = await fetch(`${API_BASE_URL}/reason/modules`);

        if (!response.ok) {
            throw new ApiError('Failed to fetch modules', response.status);
        }

        return response.json();
    },

    /**
     * Sauvegarde la conversation dans l'historique
     */
    async saveHistory(task: string, plan: ReasoningPlan, final_output: string): Promise<void> {
        await fetch(`${API_BASE_URL}/history/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task,
                plan,
                final_output
            }),
        });
    },
};

/**
 * Service API pour les modèles LLM
 */
export const modelsApi = {
    /**
     * Récupère la liste des providers et modèles disponibles
     */
    async getModels(): Promise<ModelData> {
        const response = await fetch(`${API_BASE_URL}/api/models`);

        if (!response.ok) {
            throw new ApiError('Failed to fetch models', response.status);
        }

        return response.json();
    },

    /**
     * Récupère les modèles dynamiques pour un provider spécifique
     */
    async getProviderModels(provider: string, apiKey?: string): Promise<{ models: string[], models_detailed?: { id: string, is_free: boolean }[] }> {
        const headers: Record<string, string> = {};
        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        const response = await fetch(`${API_BASE_URL}/api/providers/${provider}/models?free_only=false`, {
            headers
        });

        if (!response.ok) {
            throw new ApiError(`Failed to fetch models for ${provider}`, response.status);
        }

        return response.json();
    },
};

/**
 * Service API pour le health check
 */
export const healthApi = {
    /**
     * Vérifie l'état du backend
     */
    async check(): Promise<{ status: string; service: string }> {
        const response = await fetch(`${API_BASE_URL}/`);

        if (!response.ok) {
            throw new ApiError('Backend unavailable', response.status);
        }

        return response.json();
    },
};

/**
 * Service API pour la gestion des prompts
 */
export const promptsApi = {
    async getAll(): Promise<Prompt[]> {
        const response = await fetch(`${API_BASE_URL}/prompts/`);
        if (!response.ok) throw new ApiError('Failed to fetch prompts', response.status);
        return response.json();
    },

    async create(prompt: PromptCreate): Promise<Prompt> {
        const response = await fetch(`${API_BASE_URL}/prompts/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt),
        });
        if (!response.ok) throw new ApiError('Failed to create prompt', response.status);
        return response.json();
    },

    async update(id: string, prompt: PromptUpdate): Promise<Prompt> {
        const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt),
        });
        if (!response.ok) throw new ApiError('Failed to update prompt', response.status);
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new ApiError('Failed to delete prompt', response.status);
    }
};

/**
 * Objet API unifié pour faciliter les imports
 */
export const api = {
    ...reasoningApi,
    ...modelsApi,
    ...healthApi,
    ...promptsApi,

    /**
     * Teste la connexion au provider (Simulation via getModels pour l'instant)
     * TODO: Implémenter un vrai endpoint de test backend
     */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            // Un simple ping aux modèles pour vérifier que le backend répond
            // Si on voulait tester la clé, il faudrait un endpoint qui l'accepte
            await modelsApi.getModels();
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            return { success: false, error: msg };
        }
    }
};
