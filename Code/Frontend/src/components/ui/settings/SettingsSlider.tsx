import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SliderProps {
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
    icon: LucideIcon;
    unit?: string;
    description?: string;
}

export const SettingsSlider: React.FC<SliderProps> = ({
    value,
    onChange,
    min,
    max,
    step,
    label,
    icon: Icon,
    unit = '',
    description
}) => {
    return (
        <div className="space-y-3 p-4 rounded-xl glass-panel-next hover:bg-[var(--glass-shimmer)] transition-colors border-glass">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{label}</span>
                </div>
                <span className="text-xs font-mono bg-[var(--glass-bg)] px-2 py-1 rounded text-foreground border border-glass">
                    {value}{unit}
                </span>
            </div>

            <input
                type="range"
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />

            <div className="flex justify-between text-[10px] text-white/40 px-1 font-mono">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>

            {description && (
                <p className="text-xs text-white/50">{description}</p>
            )}
        </div>
    );
};
