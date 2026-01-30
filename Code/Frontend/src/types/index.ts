/**
 * Types partagés pour l'application AutoLogic
 */

/** Module de raisonnement de la bibliothèque des 39 modules */
export interface ReasoningModule {
    id: string;
    name: string;
    description: string;
    category: string;
}

/** Étape individuelle du plan de raisonnement */
export interface ReasoningPlanStep {
    step_number: number;
    module_id: string;
    module_name: string;
    action: string;
    expected_output: string;
}

/** Plan de raisonnement structuré */
export interface ReasoningPlan {
    steps: ReasoningPlanStep[];
    estimated_complexity: 'low' | 'medium' | 'high';
    total_steps: number;
}

/** Résultat complet du cycle Self-Discover */
export interface AutoLogicResult {
    task: string;
    plan: ReasoningPlan;
    final_output: string;
}

/** Configuration du provider/modèle LLM */
export interface LLMConfig {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    apiKey?: string;
    /** Timeout en secondes pour les requêtes API (défaut: 120) */
    timeout?: number;
}

/** Données des modèles disponibles */
export interface ModelData {
    providers: string[];
    models: Record<string, string[]>;
}

/** États de l'interface */
export type LoadingStage =
    | ''
    | 'Analyzing request intent...'
    | 'Selecting reasoning modules...'
    | 'Adapting modules to context...'
    | 'Structuring execution plan...'
    | 'Verifying plan logic...'
    | 'Executing reasoning steps...'
    | 'Validating with H2 Critic...'
    | 'Synthesizing final solution...';

/** Prompt structure */
export interface Prompt {
    id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface PromptCreate {
    title: string;
    content: string;
    tags?: string[];
}

export interface PromptUpdate {
    title?: string;
    content?: string;
    tags?: string[];
}
