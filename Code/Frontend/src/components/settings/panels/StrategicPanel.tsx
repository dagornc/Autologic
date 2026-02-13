/**
 * Strategic Agent Panel — Apple HIG + i18n
 *
 * Hero card with decorative orb illustration,
 * model selectors, temperature slider, resilience toggles.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import LiquidToggle from '../shared/LiquidToggle';
import { Cpu } from 'lucide-react';
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
    const { t } = useTranslation();

    return (
        <div className="space-y-8 pb-4">
            {/* Hero Card */}
            <GlassSurface strata={2} className="p-6 sm:p-8 relative overflow-hidden">
                {/* Decorative orb illustration */}
                <div className="absolute -top-8 -right-8 w-[160px] h-[160px] opacity-30 pointer-events-none">
                    <img src="/strategic-orb.png" alt="" className="w-full h-full object-contain" aria-hidden="true" />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Agent identity */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/15 flex items-center justify-center">
                            <Cpu size={24} className="text-[#007AFF]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground tracking-tight">{t('settings.strategic.agentTitle')}</h2>
                            <p className="text-[13px] text-muted-foreground mt-0.5">{t('settings.strategic.agentDesc')}</p>
                        </div>
                    </div>

                    {/* Model Selectors */}
                    <div className="pt-2">
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

                    {/* Temperature */}
                    <GlassSlider
                        label={t('settings.strategic.temperature')}
                        value={config.temperature}
                        min={0} max={1} step={0.1}
                        colorIdentity="strategic"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('temperature', parseFloat(e.target.value))}
                    />
                </div>
            </GlassSurface>

            {/* Resilience Section */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            >
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                    {t('settings.strategic.resilience')}
                </h3>
                <GlassSurface strata={1} className="px-4 divide-y divide-border">
                    <LiquidToggle
                        enabled={config?.retryEnabled ?? true}
                        onChange={(val) => onChange('retryEnabled', val)}
                        label={t('settings.strategic.autoRetries')}
                        description={t('settings.strategic.autoRetriesDesc')}
                        colorIdentity="strategic"
                    />
                    <LiquidToggle
                        enabled={config?.fallbackEnabled ?? true}
                        onChange={(val) => onChange('fallbackEnabled', val)}
                        label={t('settings.strategic.smartFallback')}
                        description={t('settings.strategic.smartFallbackDesc')}
                        colorIdentity="strategic"
                    />
                    <div className="py-1">
                        <GlassSlider
                            label={t('settings.strategic.rateLimit')}
                            value={config?.rateLimit ?? 15}
                            min={1} max={120} step={1}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('rateLimit', parseInt(e.target.value))}
                            colorIdentity="strategic"
                        />
                    </div>
                </GlassSurface>
            </motion.section>

            {/* System Context */}
            <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                    {t('settings.strategic.systemContext')}
                </h3>
                <GlassSurface strata={1} className="p-4">
                    <textarea
                        className="w-full bg-transparent border-none p-0 text-[15px] min-h-[100px] focus:outline-none resize-none placeholder-muted-foreground/50 leading-relaxed"
                        placeholder={t('settings.strategic.systemContextPlaceholder')}
                        value={config.systemContext || ''}
                        onChange={(e) => onChange('systemContext', e.target.value)}
                    />
                </GlassSurface>
            </section>
        </div>
    );
};

export default StrategicPanel;
