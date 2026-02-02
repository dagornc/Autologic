import React from 'react';
// Force update
import LiquidToggle from '../shared/LiquidToggle';
import { Cpu, Box, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassSlider } from '../../ui/GlassSlider';
import type { SettingsConfig, ModelData } from '../../../types/settings';
import ModelSelector from '../shared/ModelSelector';
import GlassSurface from '../shared/GlassSurface';

interface StrategicPanelWithModelsProps {
    config: SettingsConfig;
    onChange: (key: keyof SettingsConfig, value: unknown) => void;
    modelData: ModelData | null;
    loading?: boolean;
}

const StrategicPanel: React.FC<StrategicPanelWithModelsProps> = ({ config, onChange, modelData, loading }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[var(--color-strategic)]">
            <GlassSurface strata={3} className="p-8 relative overflow-hidden">
                {/* Background Decoration - smaller & less intrusive */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Cpu size={120} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[var(--color-strategic)]/10 rounded-xl border border-[var(--color-strategic)]/20 shadow-[0_0_20px_var(--color-strategic)/10]">
                            <Cpu size={28} className="text-[var(--color-strategic)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">Strategic Agent (Root)</h2>
                            <p className="text-sm text-muted-foreground mt-1">The master planner and decision maker.</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <ModelSelector
                            provider={config.provider}
                            model={config.model}
                            freeModelsOnly={config.freeModelsOnly}
                            onProviderChange={(val) => onChange('provider', val)}
                            onModelChange={(val) => onChange('model', val)}
                            onFreeModelsOnlyChange={(val) => onChange('freeModelsOnly', val)}
                            modelData={modelData}
                            loading={loading}
                            labelPrefix=""
                        />
                    </div>

                    <div className="pt-2">
                        <GlassSlider
                            label="Creativity (Temperature)"
                            value={config.temperature}
                            min={0} max={1} step={0.1}
                            colorIdentity="strategic"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('temperature', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </GlassSurface>

            {/* Resilience Section - Root */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
            >
                <div className="px-1">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-strategic)] mb-4 flex items-center gap-2">
                        <Zap size={14} className="animate-pulse" />
                        Resilience & Reliability
                    </h3>
                </div>
                <GlassSurface strata={2} className="p-6 space-y-4 divide-y divide-[var(--border)] border-[var(--color-strategic)]/20">
                    <div className="space-y-4 pb-4">
                        <LiquidToggle
                            enabled={config?.retryEnabled ?? true}
                            onChange={(val) => onChange('retryEnabled', val)}
                            label="Auto-Retries"
                            description="Automatically retry failed LLM calls."
                            colorIdentity="strategic"
                        />
                        <LiquidToggle
                            enabled={config?.fallbackEnabled ?? true}
                            onChange={(val) => onChange('fallbackEnabled', val)}
                            label="Smart Fallback"
                            description="Fallback to alternative models if overloaded."
                            colorIdentity="strategic"
                        />
                    </div>
                    <div className="pt-4">
                        <GlassSlider
                            label="Rate Limit (Req/min)"
                            value={config?.rateLimit ?? 15}
                            min={1} max={120} step={1}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('rateLimit', parseInt(e.target.value))}
                            colorIdentity="strategic"
                        />
                    </div>
                </GlassSurface>
            </motion.div>

            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest px-1 flex items-center gap-2 text-muted-foreground">
                    <Box size={14} /> System Context
                </h4>
                <GlassSurface strata={1} className="p-4">
                    <textarea
                        className="w-full bg-transparent border-none p-0 text-sm min-h-[120px] focus:outline-none resize-none placeholder-muted-foreground/50"
                        placeholder="Enter global system context..."
                        value={config.systemContext || ''}
                        onChange={(e) => onChange('systemContext', e.target.value)}
                    />
                </GlassSurface>
            </div>
        </div>
    );
};

export default StrategicPanel;
