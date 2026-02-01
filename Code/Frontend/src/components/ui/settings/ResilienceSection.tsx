import React from 'react';
import { Shield, Activity, RotateCcw, Zap } from 'lucide-react';
import { ResilienceSettings } from '../../../types/settings';
import { SettingsToggle } from './SettingsToggle';
import { SettingsSlider } from './SettingsSlider';

interface ResilienceSectionProps {
    settings: ResilienceSettings;
    onChange: (settings: ResilienceSettings) => void;
    colorClass?: string;
    title?: string;
}

export const ResilienceSection: React.FC<ResilienceSectionProps> = ({
    settings,
    onChange,
    colorClass = "text-amber-500",
    title = "System Resilience"
}) => {
    return (
        <div className="space-y-4">
            <h4 className={`text-xs font-heavy font-mono uppercase tracking-wider flex items-center gap-2 ${colorClass} mb-4`}>
                <Shield className="w-4 h-4" />
                {title}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsToggle
                    checked={settings.retryEnabled}
                    onChange={(val) => onChange({ ...settings, retryEnabled: val })}
                    label="Auto-Retry"
                    icon={RotateCcw}
                    description="Automatically retry failed requests with exponential backoff"
                />

                <SettingsToggle
                    checked={settings.fallbackEnabled}
                    onChange={(val) => onChange({ ...settings, fallbackEnabled: val })}
                    label="Model Fallback"
                    icon={Zap}
                    description="Switch to alternative models if primary fails"
                />
            </div>

            <SettingsSlider
                value={settings.rateLimit}
                onChange={(val) => onChange({ ...settings, rateLimit: val })}
                min={1}
                max={60}
                step={1}
                label="API Rate Limit"
                icon={Activity}
                unit=" req/min"
                description="Maximum number of requests per minute to prevent throttling"
            />
        </div>
    );
};
