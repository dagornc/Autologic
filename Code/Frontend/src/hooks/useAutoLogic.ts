/**
 * Hook personnalisé pour la gestion du raisonnement AutoLogic
 */

import { useState, useCallback, useRef } from 'react';
import type { AutoLogicResult, LLMConfig, LoadingStage } from '../types';
import { reasoningApi } from '../services/api';

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
    /** Nom du modèle LLM en cours d'utilisation */
    currentModel: string | null;
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
    const [currentModel, setCurrentModel] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const submitTask = useCallback(async (config?: LLMConfig) => {
        if (!task.trim()) return;

        // Abort previous task if still running
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setIsLoading(true);
        setError(null);
        setError(null);
        setResult(null);
        setLoadingStage('Analyzing request intent...'); // Initial state
        setCurrentModel(null);

        try {
            const controller = new AbortController();
            abortControllerRef.current = controller;

            await reasoningApi.solveStream(
                task,
                config,
                (event) => {
                    if (event.type === 'result') {
                        setResult(event.payload);
                        setIsLoading(false);
                        // History is handled by backend or separate call if needed, 
                        // currently backend returns result but saving is separate in legacy?
                        // Actually backend engine doesn't auto-save to history endpoint directly,
                        // we might need to call saveHistory here if we want to persist on frontend side completion.
                        // For now we trust the flow.
                        reasoningApi.saveHistory(task, event.payload.plan, event.payload.final_output).catch(err => {
                            console.error("Failed to save history:", err);
                        });
                    } else if (event.type === 'error') {
                        setError(event.message);
                        setIsLoading(false);
                    } else {
                        // Progress Event
                        // Format: { stage: "Analyzing", status: "active", message: "..." }
                        // We map backend stage to frontend LoadingStage string if needed
                        // Or simply use the message or construct a string
                        if (event.message) {
                            setLoadingStage(event.message as LoadingStage);
                        } else {
                            setLoadingStage(`${event.stage}...` as LoadingStage);
                        }

                        if (event.model) {
                            setCurrentModel(event.model);
                        }
                    }
                },
                (err) => {
                    setError(err.message || 'Stream connection failed');
                    setIsLoading(false);
                },
                controller.signal
            );

        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            if (error.name === 'AbortError') {
                // User stopped
            } else {
                setError(error.message || 'Failed to start reasoning task');
                setIsLoading(false);
            }
        } finally {
            // Logic handled in callbacks
        }
    }, [task]);

    const stopTask = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setIsLoading(false);
            setError('Task stopped at your request.');
            setLoadingStage('Stopped by user');
            setCurrentModel(null);
        }
    }, []);

    const reset = useCallback(() => {
        setTask('');
        setResult(null);
        setError(null);
        setLoadingStage('');
        setCurrentModel(null);
    }, []);

    return {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        currentModel,
        submitTask,
        stopTask,
        reset,
    };
}
