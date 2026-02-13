/**
 * Audit Agent Panel — Apple HIG + i18n
 *
 * Critic agent configuration with sync-to-strategic toggle,
 * decorative orange orb illustration, and quality controls.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { ShieldCheck, Link } from 'lucide-react';
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
    const { t } = useTranslation();
    const isSynced = config.useAuditSameAsRoot;

    return (
        <div className="space-y-8 pb-4">
            {/* Sync Control */}
            <GlassSurface strata={1} className="px-4">
                <LiquidToggle
                    enabled={isSynced}
                    onChange={(v) => onChange('useAuditSameAsRoot', v)}
                    label={t('settings.audit.syncToggle')}
                    description={t('settings.audit.syncToggleDesc')}
                    colorIdentity="audit"
                    isSyncToggle={true}
                />
            </GlassSurface>

            <div className="relative">
                {/* Linked badge overlay */}
                <AnimatePresence>
                    {isSynced && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-card/95 backdrop-blur-md border border-border px-6 py-3 rounded-2xl shadow-apple-md flex items-center gap-2.5">
                                <Link size={16} className="text-[#FF9500]" />
                                <span className="text-[14px] font-medium text-foreground">{t('settings.audit.linkedToStrategic')}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main content — fades when synced */}
                <motion.div
                    animate={{
                        opacity: isSynced ? 0.25 : 1,
                        filter: isSynced ? 'blur(3px)' : 'blur(0px)',
                    }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className={cn("space-y-8 transition-all", isSynced && "pointer-events-none")}
                >
                    {/* Hero Card */}
                    <GlassSurface strata={2} className="p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-[160px] h-[160px] opacity-25 pointer-events-none">
                            <img src="/audit-orb.png" alt="" className="w-full h-full object-contain" aria-hidden="true" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/15 flex items-center justify-center">
                                    <ShieldCheck size={24} className="text-[#FF9500]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground tracking-tight">{t('settings.audit.agentTitle')}</h2>
                                    <p className="text-[13px] text-muted-foreground mt-0.5">{t('settings.audit.agentDesc')}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <ModelSelector
                                    provider={config.auditProvider || ''}
                                    model={config.auditModel || ''}
                                    freeModelsOnly={config.auditFreeModelsOnly}
                                    onProviderChange={(val) => onChange('auditProvider', val)}
                                    onModelChange={(val) => onChange('auditModel', val)}
                                    onFreeModelsOnlyChange={(val) => onChange('auditFreeModelsOnly', val)}
                                    modelData={modelData}
                                    loading={loading}
                                    labelPrefix="Audit"
                                    disabled={isSynced}
                                />
                            </div>

                            {/* Max retries */}
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-muted-foreground">{t('settings.audit.maxRetries')}</label>
                                <input
                                    type="number"
                                    className={cn(
                                        "w-full sm:w-[120px] bg-background border border-border rounded-xl px-3.5 py-2.5 text-[15px]",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                                        "transition-all duration-200",
                                        isSynced && "opacity-40 cursor-not-allowed"
                                    )}
                                    value={config.auditMaxRetries || 3}
                                    onChange={(e) => onChange('auditMaxRetries', parseInt(e.target.value))}
                                    disabled={isSynced}
                                />
                            </div>

                            <GlassSlider
                                label={t('settings.audit.temperature')}
                                value={config.auditTemperature ?? 0.3}
                                min={0} max={1} step={0.1}
                                colorIdentity="audit"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('auditTemperature', parseFloat(e.target.value))}
                                disabled={isSynced}
                            />
                        </div>
                    </GlassSurface>

                    {/* Resilience */}
                    <section>
                        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                            {t('settings.audit.resilience')}
                        </h3>
                        <GlassSurface strata={1} className="px-4 divide-y divide-border">
                            <LiquidToggle
                                enabled={config?.auditRetryEnabled ?? true}
                                onChange={(val) => onChange('auditRetryEnabled', val)}
                                label={t('settings.audit.autoRetries')}
                                description={t('settings.audit.autoRetriesDesc')}
                                colorIdentity="audit"
                                disabled={isSynced}
                            />
                            <LiquidToggle
                                enabled={config?.auditFallbackEnabled ?? true}
                                onChange={(val) => onChange('auditFallbackEnabled', val)}
                                label={t('settings.audit.smartFallback')}
                                description={t('settings.audit.smartFallbackDesc')}
                                colorIdentity="audit"
                                disabled={isSynced}
                            />
                            <div className="py-1">
                                <GlassSlider
                                    label={t('settings.audit.rateLimit')}
                                    value={config?.auditRateLimit ?? 15}
                                    min={1} max={120} step={1}
                                    onChange={(e) => onChange('auditRateLimit', parseInt(e.target.value))}
                                    colorIdentity="audit"
                                    disabled={isSynced}
                                />
                            </div>
                        </GlassSurface>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default AuditPanel;
