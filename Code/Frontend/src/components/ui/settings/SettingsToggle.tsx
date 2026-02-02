import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    icon?: LucideIcon;
    description?: string;
}

export const SettingsToggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    label,
    icon: Icon,
    description
}) => {
    // If no label, just render the switch
    if (!label) {
        return (
            <div
                onClick={() => onChange(!checked)}
                className={`
                    relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-300
                    ${checked ? 'bg-neon-cyan' : 'bg-white/10'}
                `}
            >
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 22 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => onChange(!checked)}
            className={`
                group flex items-center justify-between p-4 rounded-xl border border-white/5 cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.05]
            `}
        >
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className={`p-2 rounded-lg transition-colors ${checked ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-white/40'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <div>
                    <div className={`text-sm font-medium transition-colors ${checked ? 'text-white' : 'text-white/60'}`}>
                        {label}
                    </div>
                    {description && (
                        <div className="text-xs text-white/30 mt-0.5">
                            {description}
                        </div>
                    )}
                </div>
            </div>

            <div className={`
                relative w-11 h-6 rounded-full transition-colors duration-300
                ${checked ? 'bg-neon-cyan' : 'bg-white/10'}
            `}>
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 22 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </div>
    );
};
