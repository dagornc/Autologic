import React from 'react';
import GlassSurface from '../shared/GlassSurface';
import LiquidToggle from '../shared/LiquidToggle';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Eye } from 'lucide-react';
import type { SettingsConfig } from '../../../types/settings';

interface GeneralPanelProps {
    config?: SettingsConfig;
    onChange?: (key: keyof SettingsConfig, value: unknown) => void;
}


const GeneralPanel: React.FC<GeneralPanelProps> = ({ config, onChange }) => {
    const { theme, setTheme } = useTheme();

    const handleChange = (key: keyof SettingsConfig, value: unknown) => {
        if (onChange) {
            onChange(key, value);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto pr-2 pb-4">
            {/* Appearance Section */}
            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-general)] mb-2 flex items-center gap-2">
                    <Sun size={12} />
                    Appearance & Behavior
                </h3>
                <GlassSurface strata={2} className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Theme Mode</span>
                        <div className="flex bg-[var(--glass-2-bg)] rounded-full p-1 border border-[var(--border)]">
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Sun size={14} />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-[var(--color-primary)] text-black shadow-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Moon size={14} />
                            </button>
                        </div>
                    </div>
                </GlassSurface>
            </section>


            {/* Accessibility Section */}
            <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-general)] mb-2 flex items-center gap-2">
                    <Eye size={12} />
                    Accessibility
                </h3>
                <GlassSurface strata={2} className="p-3 divide-y divide-[var(--border)]">
                    <LiquidToggle
                        enabled={config?.reducedMotion ?? false}
                        onChange={(val) => handleChange('reducedMotion', val)}
                        label="Reduced Motion"
                        description="Minimize animations for a more static experience."
                        colorIdentity="general"
                    />
                    <LiquidToggle
                        enabled={config?.dyslexicFont ?? false}
                        onChange={(val) => handleChange('dyslexicFont', val)}
                        label="Dyslexic Friendly Font"
                        description="Switch to OpenDyslexic or increased spacing."
                        colorIdentity="general"
                    />
                    <LiquidToggle
                        enabled={config?.highContrast ?? false}
                        onChange={(val) => handleChange('highContrast', val)}
                        label="High Contrast"
                        description="Increase legibility with stronger borders and solid backgrounds."
                        colorIdentity="general"
                    />
                </GlassSurface>
            </section>
        </div>
    );
};

export default GeneralPanel;
