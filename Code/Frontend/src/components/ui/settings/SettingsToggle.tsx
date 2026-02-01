import React from 'react';
import { LucideIcon, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
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
    return (
        <div
            onClick={() => onChange(!checked)}
            className={`
                group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300
                ${checked
                    ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`
                    p-2 rounded-lg transition-colors
                    ${checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}
                `}>
                    {Icon ? <Icon className="w-5 h-5" /> : (checked ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />)}
                </div>
                <div>
                    <div className={`text-sm font-medium transition-colors ${checked ? 'text-emerald-100' : 'text-gray-300'}`}>
                        {label}
                    </div>
                    {description && (
                        <div className="text-xs text-white/40 mt-0.5">
                            {description}
                        </div>
                    )}
                </div>
            </div>

            <div className={`
                relative w-12 h-6 rounded-full transition-colors duration-300
                ${checked ? 'bg-emerald-500' : 'bg-white/10'}
            `}>
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </div>
    );
};
