import React, { useMemo } from 'react';
import type { ModelData } from '../../../types/settings';
import LiquidToggle from './LiquidToggle';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ModelSelectorProps {
    provider: string;
    model: string;
    freeModelsOnly?: boolean;
    onProviderChange: (value: string) => void;
    onModelChange: (value: string) => void;
    onFreeModelsOnlyChange?: (value: boolean) => void;
    modelData: ModelData | null;
    loading?: boolean;
    labelPrefix?: string;
    disabled?: boolean;
}

const GlassSelect = ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder = "Select..."
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    options: string[],
    disabled?: boolean,
    placeholder?: string
}) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <div className="relative">
            <select
                className={cn(
                    "w-full bg-[var(--glass-1-bg)] border border-[var(--border)] rounded-md pl-3 pr-8 py-2 text-sm appearance-none transition-all",
                    "focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] hover:bg-[var(--glass-2-bg)]",
                    disabled && "opacity-50 cursor-not-allowed text-muted-foreground"
                )}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {options.length === 0 && <option value={value}>{value || placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-[var(--background)] text-foreground">
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
    </div>
);

const ModelSelector: React.FC<ModelSelectorProps> = ({
    provider,
    model,
    freeModelsOnly,
    onProviderChange,
    onModelChange,
    onFreeModelsOnlyChange,
    modelData,
    loading,
    labelPrefix = "",
    disabled
}) => {

    // Get available providers
    const providers = useMemo(() => {
        if (!modelData?.providers) return [provider].filter(Boolean);
        return modelData.providers;
    }, [modelData, provider]);

    // Get available models for selected provider
    const availableModels = useMemo(() => {
        if (!modelData) return [];

        let models = modelData.models?.[provider] || [];

        // If OpenRouter and Free Only is checked, filter the list
        if (provider.toLowerCase() === 'openrouter' && freeModelsOnly) {
            if (modelData.modelsDetailed?.[provider]) {
                // Filter using detailed info if available
                models = modelData.modelsDetailed[provider]
                    .filter(m => m.is_free)
                    .map(m => m.id);
            } else {
                // Fallback to name heuristic
                models = models.filter(m => m.includes(':free') || m.toLowerCase().includes('free'));
            }
        }

        // Ensure current model is in list if it's set
        if (model && !models.includes(model) && !freeModelsOnly) {
            return [model, ...models];
        }

        return models;
    }, [modelData, provider, freeModelsOnly, model]);


    const isAutoRouting = model === 'openrouter/auto';

    // Determine color identity for toggles
    const colorId = labelPrefix ? (labelPrefix.toLowerCase().includes('worker') ? 'tactical' : 'audit') : 'strategic';
    // Mapping string to literal type
    type ColorIdType = 'strategic' | 'tactical' | 'audit' | 'general';
    const validColors: ColorIdType[] = ['strategic', 'tactical', 'audit', 'general'];
    const safeColorId: ColorIdType = validColors.includes(colorId as ColorIdType) ? colorId as ColorIdType : 'strategic';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Provider Selector */}
                <GlassSelect
                    label={`${labelPrefix} Provider`.trim()}
                    value={provider}
                    onChange={onProviderChange}
                    options={providers}
                    disabled={disabled || loading}
                />

                {/* Model Selector */}
                {loading ? (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{`${labelPrefix} Model`.trim()}</label>
                        <div className="flex items-center gap-2 h-9 px-3 border border-[var(--border)] rounded-md bg-[var(--glass-1-bg)] text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading models...</span>
                        </div>
                    </div>
                ) : (
                    <GlassSelect
                        label={`${labelPrefix} Model`.trim()}
                        value={model}
                        onChange={onModelChange}
                        options={availableModels}
                        disabled={disabled || (provider.toLowerCase() === 'openrouter' && isAutoRouting)}
                    />
                )}
            </div>

            {/* OpenRouter Special Controls */}
            {provider.toLowerCase() === 'openrouter' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-2">
                    {/* Auto Routing Toggle */}
                    <LiquidToggle
                        enabled={isAutoRouting}
                        onChange={(enabled) => onModelChange(enabled ? 'openrouter/auto' : '')}
                        label="Auto Routing"
                        description="Let OpenRouter select the best model."
                        colorIdentity={safeColorId}
                    />

                    {/* Free Models Filter */}
                    {onFreeModelsOnlyChange && (
                        <LiquidToggle
                            enabled={freeModelsOnly || false}
                            onChange={onFreeModelsOnlyChange}
                            label="Free Models Only"
                            description="Filter list to show only free-to-use models."
                            colorIdentity={safeColorId}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ModelSelector;
