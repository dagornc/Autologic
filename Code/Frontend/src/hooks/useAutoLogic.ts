/**
 * Hook personnalisé pour la gestion du raisonnement AutoLogic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AutoLogicResult, LLMConfig, LoadingStage } from '../types';
import { reasoningApi, ApiError } from '../services/api';

/** Étapes de chargement pour l'UX */
const LOADING_STAGES: LoadingStage[] = [
    'Analyzing request intent...',
    'Selecting reasoning modules...',
    'Adapting modules to context...',
    'Structuring execution plan...',
    'Verifying plan logic...',
    'Executing reasoning steps...',
    'Validating with H2 Critic...',
    'Synthesizing final solution...',
    'Auditing final response...',
];


/** Intervalle entre les changements de stage (ms) */
const STAGE_INTERVAL = 1200;

interface UseAutoLogicReturn {
    /** Tâche en cours de saisie */
    task: string;
    /** Définit la tâche */
    setTask: (task: string) => void;
    /** Indique si une requête est en cours */
    isLoading: boolean;
    /** Résultat du raisonnement */
    result: AutoLogicResult | null;
    /** Message d'erreur */
    error: string | null;
    /** Stage de chargement actuel pour l'UX */
    loadingStage: LoadingStage;
    /** Soumet la tâche pour résolution */
    submitTask: (config?: LLMConfig) => Promise<void>;
    /** Arrête la tâche en cours */
    stopTask: () => void;
    /** Réinitialise l'état */
    reset: () => void;
}

/**
 * Hook pour gérer le cycle de raisonnement AutoLogic
 */
export function useAutoLogic(): UseAutoLogicReturn {
    const [task, setTask] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AutoLogicResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('');
    const abortControllerRef = useRef<AbortController | null>(null);

    // Animation des stages de chargement
    useEffect(() => {
        if (!isLoading) {
            setLoadingStage('');
            return;
        }

        let currentStage = 0;
        setLoadingStage(LOADING_STAGES[0]);

        const interval = setInterval(() => {
            currentStage++;
            if (currentStage < LOADING_STAGES.length) {
                setLoadingStage(LOADING_STAGES[currentStage]);
            }
        }, STAGE_INTERVAL);

        return () => clearInterval(interval);
    }, [isLoading]);

    const submitTask = useCallback(async (config?: LLMConfig) => {
        if (!task.trim()) return;

        // Abort previous task if still running
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Create new controller for this request
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const data = await reasoningApi.solveFull(task, config, controller.signal);
            setResult(data);

            // Save to history in background
            reasoningApi.saveHistory(task, data.plan, data.final_output).catch(err => {
                console.error("Failed to save history:", err);
            });
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    // Only set error if it wasn't a intentional user stop (which sets its own error)
                    // If we are here, it means it's likely a timeout from api.ts
                    if (isLoading) {
                        setError('Request timed out. The reasoning engine is taking too long to respond.');
                    }
                } else if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError(err.message || 'Failed to connect to the AutoLogic Engine.');
                }
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            // Only clear loading if this was the current request
            if (abortControllerRef.current?.signal.aborted === false || abortControllerRef.current === null) {
                setIsLoading(false);
            }
            abortControllerRef.current = null;
        }
    }, [task, isLoading]);

    const stopTask = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setError('Task stopped by user.');
            setLoadingStage('');
        }
    }, []);

    const reset = useCallback(() => {
        setTask('');
        setResult(null);
        setError(null);
        setLoadingStage('');
    }, []);

    return {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        submitTask,
        stopTask,
        reset,
    };
}
