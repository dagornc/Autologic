/**
 * Hook personnalisé pour la gestion du raisonnement AutoLogic
 */

import { useState, useCallback, useRef } from 'react';
import type { AutoLogicResult, LLMConfig, LoadingStage } from '../types';
import { reasoningApi } from '../services/api';
import type { LogMessage } from '../components/ui/LoadingOverlay';

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
    /** Les 3 derniers messages de log */
    recentLogs: LogMessage[];
    /** Soumet la tâche pour résolution */
    submitTask: (config?: LLMConfig) => Promise<void>;
    /** Arrête la tâche en cours */
    stopTask: () => void;
    /** Réinitialise l'état */
    reset: () => void;
}

/**
 * Détecte le niveau de log à partir du message
 */
function detectLogLevel(message: string): 'INFO' | 'WARNING' | 'ERROR' {
    const upperMsg = message.toUpperCase();
    if (upperMsg.includes('ERROR') || upperMsg.includes('ERREUR') || upperMsg.includes('FAILED') || upperMsg.includes('ÉCHEC')) {
        return 'ERROR';
    }
    if (upperMsg.includes('WARNING') || upperMsg.includes('WARN') || upperMsg.includes('ATTENTION')) {
        return 'WARNING';
    }
    return 'INFO';
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
    const [recentLogs, setRecentLogs] = useState<LogMessage[]>([]);
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
        setResult(null);
        setLoadingStage('Analyzing request intent...'); // Initial state
        setCurrentModel(null);
        setRecentLogs([]); // Reset logs on new task

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
                        const displayMessage = event.message || `${event.stage}...`;
                        setLoadingStage(displayMessage as LoadingStage);

                        // Ajouter le message aux logs récents
                        const logMessage: LogMessage = {
                            level: detectLogLevel(displayMessage),
                            message: displayMessage,
                            timestamp: new Date()
                        };
                        setRecentLogs(prev => [...prev.slice(-2), logMessage]); // Garder seulement les 3 derniers

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
        setRecentLogs([]);
    }, []);

    return {
        task,
        setTask,
        isLoading,
        result,
        error,
        loadingStage,
        currentModel,
        recentLogs,
        submitTask,
        stopTask,
        reset,
    };
}
