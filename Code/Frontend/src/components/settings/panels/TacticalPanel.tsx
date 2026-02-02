import React from 'react';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { Bot, Link, Zap } from 'lucide-react';
import { GlassSlider } from '../../ui/GlassSlider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import type { SettingsConfig, ModelData } from '../../../types/settings';
import ModelSelector from '../shared/ModelSelector';

interface TacticalPanelWithModelsProps {
    config: SettingsConfig;
    onChange: (key: keyof SettingsConfig, value: unknown) => void;
    modelData: ModelData | null;
    loading?: boolean;
}

const TacticalPanel: React.FC<TacticalPanelWithModelsProps> = ({ config, onChange, modelData, loading }) => {
    const isSynced = config.useWorkerSameAsRoot;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[var(--color-tactical)]">

            {/* Sync Control */}
            <GlassSurface strata={2} className="p-4 border-[var(--color-tactical)]/30">
                <LiquidToggle
                    enabled={isSynced}
                    onChange={(v) => onChange('useWorkerSameAsRoot', v)}
                    label="Use Strategic Configuration"
                    description="Inherit settings from the Root agent for execution tasks."
                    colorIdentity="tactical"
                    isSyncToggle={true}
                />
            </GlassSurface>

            <div className="relative">
                {/* Visual "Pulse" Badge when synced */}
                <AnimatePresence>
                    {isSynced && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-[var(--glass-3-bg)] backdrop-blur-md border border-[var(--color-tactical)]/50 px-8 py-4 rounded-full shadow-[0_0_40px_rgba(var(--color-tactical-rgb),0.3)] flex items-center gap-3">
                                <Link size={18} className="text-[var(--color-tactical)] animate-pulse" />
                                <span className="text-sm font-semibold text-foreground">Linked to Strategic Brain</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content with Blur/Fade effect */}
                <motion.div
                    animate={{
                        opacity: isSynced ? 0.3 : 1,
                        filter: isSynced ? 'blur(4px)' : 'blur(0px)',
                        scale: isSynced ? 0.98 : 1
                    }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }} // Liquid ease
                    className={cn("space-y-6 transition-all", isSynced && "pointer-events-none")}
                >
                    <GlassSurface strata={3} className="p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Bot size={120} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[var(--color-tactical)]/10 rounded-xl border border-[var(--color-tactical)]/20 shadow-[0_0_20px_var(--color-tactical)/10]">
                                    <Bot size={28} className="text-[var(--color-tactical)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">Tactical Agent (Worker)</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Executes specific sub-tasks defined by the root.</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <ModelSelector
                                    provider={config.workerProvider || ''}
                                    model={config.workerModel || ''}
                                    freeModelsOnly={config.workerFreeModelsOnly}
                                    onProviderChange={(val) => onChange('workerProvider', val)}
                                    onModelChange={(val) => onChange('workerModel', val)}
                                    onFreeModelsOnlyChange={(val) => onChange('workerFreeModelsOnly', val)}
                                    modelData={modelData}
                                    loading={loading}
                                    labelPrefix="Worker"
                                    disabled={isSynced}
                                />
                            </div>

                            <div className="pt-2">
                                <GlassSlider
                                    label="Creativity (Temperature)"
                                    value={config.workerTemperature ?? 0.3}
                                    min={0} max={1} step={0.1}
                                    colorIdentity="tactical"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('workerTemperature', parseFloat(e.target.value))}
                                    disabled={isSynced}
                                />
                            </div>
                        </div>
                    </GlassSurface>

                    {/* Resilience Section - Worker */}
                    <div className={cn("space-y-4", isSynced && "pointer-events-none")}>
                        <div className="px-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-tactical)] mb-4 flex items-center gap-2">
                                <Zap size={14} className="animate-pulse" />
                                Resilience & Reliability
                            </h3>
                        </div>
                        <GlassSurface strata={2} className="p-6 space-y-4 divide-y divide-[var(--border)] border-[var(--color-tactical)]/20">
                            <div className="space-y-4 pb-4">
                                <LiquidToggle
                                    enabled={config?.workerRetryEnabled ?? true}
                                    onChange={(val) => onChange('workerRetryEnabled', val)}
                                    label="Auto-Retries"
                                    description="Automatically retry failed LLM calls."
                                    colorIdentity="tactical"
                                    disabled={isSynced}
                                />
                                <LiquidToggle
                                    enabled={config?.workerFallbackEnabled ?? true}
                                    onChange={(val) => onChange('workerFallbackEnabled', val)}
                                    label="Smart Fallback"
                                    description="Fallback to alternative models if overloaded."
                                    colorIdentity="tactical"
                                    disabled={isSynced}
                                />
                            </div>
                            <div className="pt-4">
                                <GlassSlider
                                    label="Rate Limit (Req/min)"
                                    value={config?.workerRateLimit ?? 15}
                                    min={1} max={120} step={1}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('workerRateLimit', parseInt(e.target.value))}
                                    colorIdentity="tactical"
                                    disabled={isSynced}
                                />
                            </div>
                        </GlassSurface>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TacticalPanel;
