/**
 * Tactical Agent Panel — Apple HIG + i18n
 *
 * Worker agent configuration with sync-to-strategic toggle,
 * decorative green orb illustration, and resilience controls.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { Bot, Link } from 'lucide-react';
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
    const { t } = useTranslation();
    const isSynced = config.useWorkerSameAsRoot;

    return (
        <div className="space-y-8 pb-4">
            {/* Sync Control */}
            <GlassSurface strata={1} className="px-4">
                <LiquidToggle
                    enabled={isSynced}
                    onChange={(v) => onChange('useWorkerSameAsRoot', v)}
                    label={t('settings.tactical.syncToggle')}
                    description={t('settings.tactical.syncToggleDesc')}
                    colorIdentity="tactical"
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
                                <Link size={16} className="text-[#34C759]" />
                                <span className="text-[14px] font-medium text-foreground">{t('settings.tactical.linkedToStrategic')}</span>
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
                            <img src="/tactical-orb.png" alt="" className="w-full h-full object-contain" aria-hidden="true" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/15 flex items-center justify-center">
                                    <Bot size={24} className="text-[#34C759]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground tracking-tight">{t('settings.tactical.agentTitle')}</h2>
                                    <p className="text-[13px] text-muted-foreground mt-0.5">{t('settings.tactical.agentDesc')}</p>
                                </div>
                            </div>

                            <div className="pt-2">
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

                            <GlassSlider
                                label={t('settings.tactical.temperature')}
                                value={config.workerTemperature ?? 0.3}
                                min={0} max={1} step={0.1}
                                colorIdentity="tactical"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('workerTemperature', parseFloat(e.target.value))}
                                disabled={isSynced}
                            />
                        </div>
                    </GlassSurface>

                    {/* Resilience */}
                    <section>
                        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                            {t('settings.tactical.resilience')}
                        </h3>
                        <GlassSurface strata={1} className="px-4 divide-y divide-border">
                            <LiquidToggle
                                enabled={config?.workerRetryEnabled ?? true}
                                onChange={(val) => onChange('workerRetryEnabled', val)}
                                label={t('settings.tactical.autoRetries')}
                                description={t('settings.tactical.autoRetriesDesc')}
                                colorIdentity="tactical"
                                disabled={isSynced}
                            />
                            <LiquidToggle
                                enabled={config?.workerFallbackEnabled ?? true}
                                onChange={(val) => onChange('workerFallbackEnabled', val)}
                                label={t('settings.tactical.smartFallback')}
                                description={t('settings.tactical.smartFallbackDesc')}
                                colorIdentity="tactical"
                                disabled={isSynced}
                            />
                            <div className="py-1">
                                <GlassSlider
                                    label={t('settings.tactical.rateLimitLabel')}
                                    value={config?.workerRateLimit ?? 15}
                                    min={1} max={120} step={1}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('workerRateLimit', parseInt(e.target.value))}
                                    colorIdentity="tactical"
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

export default TacticalPanel;
