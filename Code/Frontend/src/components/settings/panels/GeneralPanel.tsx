/**
 * General Settings Panel — Apple HIG + i18n
 *
 * Appearance toggle (light/dark) and Accessibility section
 * with clean grouped rows and iOS toggles.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import type { SettingsConfig } from '../../../types/settings';

interface GeneralPanelProps {
    config?: SettingsConfig;
    onChange?: (key: keyof SettingsConfig, value: unknown) => void;
}


const GeneralPanel: React.FC<GeneralPanelProps> = ({ config, onChange }) => {
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();

    const handleChange = (key: keyof SettingsConfig, value: unknown) => {
        if (onChange) {
            onChange(key, value);
        }
    };

    return (
        <div className="space-y-8 pb-4">
            {/* Appearance Section */}
            <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                    {t('settings.general.appearance')}
                </h3>
                <GlassSurface strata={1} className="px-4 py-1">
                    <div className="flex items-center justify-between py-3.5 min-h-[44px]">
                        <span className="text-[15px] font-medium text-foreground">{t('settings.general.themeMode')}</span>
                        <div className="flex bg-background rounded-full p-1 border border-border">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 rounded-full transition-all duration-200 ${theme === 'light'
                                    ? 'bg-primary text-white shadow-apple-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                aria-label={t('common.theme.light')}
                            >
                                <Sun size={16} />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 rounded-full transition-all duration-200 ${theme === 'dark'
                                    ? 'bg-primary text-white shadow-apple-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                aria-label={t('common.theme.dark')}
                            >
                                <Moon size={16} />
                            </button>
                        </div>
                    </div>
                </GlassSurface>
            </section>

            {/* Accessibility Section */}
            <section>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                    {t('settings.general.accessibility')}
                </h3>
                <GlassSurface strata={1} className="px-4 divide-y divide-border">
                    <LiquidToggle
                        enabled={config?.reducedMotion ?? false}
                        onChange={(val) => handleChange('reducedMotion', val)}
                        label={t('settings.general.reducedMotion')}
                        description={t('settings.general.reducedMotionDesc')}
                        colorIdentity="general"
                    />
                    <LiquidToggle
                        enabled={config?.dyslexicFont ?? false}
                        onChange={(val) => handleChange('dyslexicFont', val)}
                        label={t('settings.general.dyslexicFont')}
                        description={t('settings.general.dyslexicFontDesc')}
                        colorIdentity="general"
                    />
                    <LiquidToggle
                        enabled={config?.highContrast ?? false}
                        onChange={(val) => handleChange('highContrast', val)}
                        label={t('settings.general.highContrast')}
                        description={t('settings.general.highContrastDesc')}
                        colorIdentity="general"
                    />
                </GlassSurface>
            </section>
        </div>
    );
};

export default GeneralPanel;
