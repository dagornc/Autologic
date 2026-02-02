import React from 'react';
import { motion } from 'framer-motion';

interface NeonSliderProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    unit?: string;
    icon?: React.ElementType;
}

export const NeonSlider: React.FC<NeonSliderProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    unit = "",
    icon: Icon
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-white/50" />}
                    <label className="text-[12px] uppercase tracking-[0.05em] font-medium text-white/50">
                        {label}
                    </label>
                </div>
                <div className="px-2 py-1 bg-black/30 border border-white/10 rounded-md min-w-[40px] text-center font-mono text-[14px] text-neon-cyan">
                    {value}{unit}
                </div>
            </div>

            <div className="relative h-6 flex items-center group">
                {/* Track Background */}
                <div className="absolute w-full h-1 bg-white/10 rounded-full" />

                {/* Fill Gradient */}
                <div
                    className="absolute h-1 bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all duration-100"
                    style={{ width: `${percentage}%` }}
                />

                {/* Input Slider (Hidden but functional) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
                />

                {/* Thumb Visual */}
                <motion.div
                    className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-neon-cyan pointer-events-none"
                    style={{ left: `calc(${percentage}% - 10px)` }}
                    whileHover={{ scale: 1.2 }}
                />
            </div>
        </div>
    );
};
