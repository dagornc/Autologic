/**
 * Apple HIG Model Selector
 *
 * Clean dropdown selectors for Provider and Model with
 * Apple-style select inputs, consistent with macOS System Settings.
 */

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

const AppleSelect = ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder = "Select..."
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    disabled?: boolean;
    placeholder?: string;
}) => (
    <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-muted-foreground">{label}</label>
        <div className="relative">
            <select
                className={cn(
                    "w-full bg-background border border-border rounded-xl pl-3.5 pr-9 py-2.5 text-[15px] appearance-none",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                    "hover:border-foreground/20",
                    disabled && "opacity-40 cursor-not-allowed text-muted-foreground"
                )}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                {options.length === 0 && <option value={value}>{value || placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-background text-foreground">
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
    const providers = useMemo(() => {
        if (!modelData?.providers) return [provider].filter(Boolean);
        return modelData.providers;
    }, [modelData, provider]);

    const availableModels = useMemo(() => {
        if (!modelData) return [];
        let models = modelData.models?.[provider] || [];
        if (provider.toLowerCase() === 'openrouter' && freeModelsOnly) {
            if (modelData.modelsDetailed?.[provider]) {
                models = modelData.modelsDetailed[provider]
                    .filter(m => m.is_free)
                    .map(m => m.id);
            } else {
                models = models.filter(m => m.includes(':free') || m.toLowerCase().includes('free'));
            }
        }
        if (model && !models.includes(model) && !freeModelsOnly) {
            return [model, ...models];
        }
        return models;
    }, [modelData, provider, freeModelsOnly, model]);

    const isAutoRouting = model === 'openrouter/auto';

    const colorId = labelPrefix ? (labelPrefix.toLowerCase().includes('worker') ? 'tactical' : 'audit') : 'strategic';
    type ColorIdType = 'strategic' | 'tactical' | 'audit' | 'general';
    const validColors: ColorIdType[] = ['strategic', 'tactical', 'audit', 'general'];
    const safeColorId: ColorIdType = validColors.includes(colorId as ColorIdType) ? colorId as ColorIdType : 'strategic';

    return (
        <div className="space-y-4">
            {/* Grid: side-by-side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AppleSelect
                    label={`${labelPrefix} Provider`.trim()}
                    value={provider}
                    onChange={onProviderChange}
                    options={providers}
                    disabled={disabled || loading}
                />

                {loading ? (
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-muted-foreground">{`${labelPrefix} Model`.trim()}</label>
                        <div className="flex items-center gap-2 h-[42px] px-3.5 border border-border rounded-xl bg-background text-muted-foreground text-[15px]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading models...</span>
                        </div>
                    </div>
                ) : (
                    <AppleSelect
                        label={`${labelPrefix} Model`.trim()}
                        value={model}
                        onChange={onModelChange}
                        options={availableModels}
                        disabled={disabled || (provider.toLowerCase() === 'openrouter' && isAutoRouting)}
                    />
                )}
            </div>

            {/* OpenRouter options */}
            {provider.toLowerCase() === 'openrouter' && (
                <div className="space-y-0 divide-y divide-border">
                    <LiquidToggle
                        enabled={isAutoRouting}
                        onChange={(enabled) => onModelChange(enabled ? 'openrouter/auto' : '')}
                        label="Auto Routing"
                        description="Let OpenRouter select the best model."
                        colorIdentity={safeColorId}
                    />

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
