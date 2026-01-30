/**
 * Couche API centralisée pour AutoLogic
 */

import type { AutoLogicResult, ModelData, LLMConfig, Prompt, PromptCreate, PromptUpdate } from '../types';

/** URL de base de l'API backend */
const API_BASE_URL = 'http://127.0.0.1:8000';

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
    timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Service API pour les opérations de raisonnement
 */
export const reasoningApi = {
    /**
     * Exécute le cycle complet de raisonnement
     */
    async solveFull(task: string, config?: LLMConfig): Promise<AutoLogicResult> {
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
                        timeout: config.timeout
                    } : {},
                }),
            },
            timeoutMs
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
    async saveHistory(task: string, plan: any, final_output: string): Promise<void> {
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
