import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NumberInputProps {
    value?: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    label: string;
    icon: LucideIcon;
    unit?: string;
}

export const SettingsNumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    min = 0,
    max = 99999,
    label,
    icon: Icon,
    unit = ''
}) => {
    // Ensure value is defined, fallback to min or 0
    const safeValue = value ?? min ?? 0;

    const handleIncrement = () => {
        if (max === undefined || safeValue < max) {
            onChange(safeValue + 1);
        }
    };

    const handleDecrement = () => {
        if (min === undefined || safeValue > min) {
            onChange(safeValue - 1);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
                return;
            }
            onChange(val);
        }
    };

    return (
        <div className="space-y-3 p-4 rounded-xl glass-panel-next hover:bg-[var(--glass-shimmer)] transition-colors border-glass">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span>{label}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleDecrement}
                    disabled={min !== undefined && safeValue <= min}
                    className="p-2 rounded-lg btn-ghost-liquid disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                    <input
                        type="number"
                        value={safeValue}
                        onChange={handleChange}
                        className="w-full input-liquid text-center font-mono text-sm"
                    />
                    {unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
                            {unit}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleIncrement}
                    disabled={max !== undefined && safeValue >= max}
                    className="p-2 rounded-lg btn-ghost-liquid disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
