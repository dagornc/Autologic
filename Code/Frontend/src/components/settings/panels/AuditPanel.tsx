import React from 'react';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { ShieldCheck, Link, Zap } from 'lucide-react';
import { GlassSlider } from '../../ui/GlassSlider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import type { SettingsConfig, ModelData } from '../../../types/settings';
import ModelSelector from '../shared/ModelSelector';

interface AuditPanelWithModelsProps {
    config: SettingsConfig;
    onChange: (key: keyof SettingsConfig, value: unknown) => void;
    modelData: ModelData | null;
    loading?: boolean;
}

const AuditPanel: React.FC<AuditPanelWithModelsProps> = ({ config, onChange, modelData, loading }) => {
    const isSynced = config.useAuditSameAsRoot;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-[var(--color-audit)]">
            {/* Sync Control */}
            <GlassSurface strata={2} className="p-4 border-[var(--color-audit)]/30">
                <LiquidToggle
                    enabled={isSynced}
                    onChange={(v) => onChange('useAuditSameAsRoot', v)}
                    label="Use Strategic Configuration"
                    description="Use the main brain for validation (recommended for consistency)."
                    colorIdentity="audit"
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
                            <div className="bg-[var(--glass-3-bg)] backdrop-blur-md border border-[var(--color-audit)]/50 px-8 py-4 rounded-full shadow-[0_0_40px_rgba(var(--color-audit-rgb),0.3)] flex items-center gap-3">
                                <Link size={18} className="text-[var(--color-audit)] animate-pulse" />
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
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className={cn("space-y-6 transition-all", isSynced && "pointer-events-none")}
                >
                    <GlassSurface strata={3} className="p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <ShieldCheck size={120} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[var(--color-audit)]/10 rounded-xl border border-[var(--color-audit)]/20 shadow-[0_0_20px_var(--color-audit)/10]">
                                    <ShieldCheck size={28} className="text-[var(--color-audit)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground leading-tight tracking-tight">Audit Agent (Critic)</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Validates the output of the Tactical agent.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <ModelSelector
                                        provider={config.auditProvider || ''}
                                        model={config.auditModel || ''}
                                        freeModelsOnly={config.auditFreeModelsOnly}
                                        onProviderChange={(val) => onChange('auditProvider', val)}
                                        onModelChange={(val) => onChange('model', val)}
                                        onFreeModelsOnlyChange={(val) => onChange('auditFreeModelsOnly', val)}
                                        modelData={modelData}
                                        loading={loading}
                                        labelPrefix="Audit"
                                        disabled={isSynced}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Max Audit Retries</label>
                                    <GlassSurface strata={1} className="p-0.5">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-none px-4 py-2.5 text-sm focus:outline-none placeholder-muted-foreground/50"
                                            value={config.auditMaxRetries || 3}
                                            onChange={(e) => onChange('auditMaxRetries', parseInt(e.target.value))}
                                            disabled={isSynced}
                                        />
                                    </GlassSurface>
                                </div>
                            </div>

                            <div className="pt-2">
                                <GlassSlider
                                    label="Creativity (Temperature)"
                                    value={config.auditTemperature ?? 0.3}
                                    min={0} max={1} step={0.1}
                                    colorIdentity="audit"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('auditTemperature', parseFloat(e.target.value))}
                                    disabled={isSynced}
                                />
                            </div>
                        </div>
                    </GlassSurface>
                </motion.div>

                {/* Resilience Section */}
                <motion.div
                    animate={{
                        opacity: isSynced ? 0.3 : 1,
                        filter: isSynced ? 'blur(4px)' : 'blur(0px)',
                    }}
                    transition={{ duration: 0.6 }}
                    className={cn("mt-8 space-y-4 transition-all", isSynced && "pointer-events-none")}
                >
                    <div className="px-1">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-audit)] mb-4 flex items-center gap-2">
                            <Zap size={14} className="animate-pulse" />
                            Resilience & Reliability
                        </h3>
                    </div>
                    <GlassSurface strata={2} className="p-6 space-y-4 divide-y divide-[var(--border)] border-[var(--color-audit)]/20">
                        <div className="space-y-4 pb-4">
                            <LiquidToggle
                                enabled={config?.auditRetryEnabled ?? true}
                                onChange={(val) => onChange('auditRetryEnabled', val)}
                                label="Auto-Retries"
                                description="Automatically retry failed LLM calls."
                                colorIdentity="audit"
                                disabled={isSynced}
                            />
                            <LiquidToggle
                                enabled={config?.auditFallbackEnabled ?? true}
                                onChange={(val) => onChange('auditFallbackEnabled', val)}
                                label="Smart Fallback"
                                description="Fallback to alternative models if overloaded."
                                colorIdentity="audit"
                                disabled={isSynced}
                            />
                        </div>
                        <div className="pt-4">
                            <GlassSlider
                                label="Rate Limit (Req/min)"
                                value={config?.auditRateLimit ?? 15}
                                min={1} max={120} step={1}
                                onChange={(e) => onChange('auditRateLimit', parseInt(e.target.value))}
                                colorIdentity="audit"
                                disabled={isSynced}
                            />
                        </div>
                    </GlassSurface>
                </motion.div>
            </div>
        </div>
    );
};

export default AuditPanel;
