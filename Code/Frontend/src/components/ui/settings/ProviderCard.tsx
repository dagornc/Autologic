import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProviderCardProps {
    id: string;
    name: string;
    icon: string;
    color: string;
    isSelected: boolean;
    onClick: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
    name,
    icon,
    color,
    isSelected,
    onClick
}) => {
    return (
        <motion.button
            whileHover={{ translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                relative aspect-[16/10] rounded-2xl p-4 flex flex-col items-start justify-end gap-2 overflow-hidden transition-all duration-300
                ${isSelected
                    ? 'border-2 border-transparent'
                    : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 shadow-lg'
                }
            `}
            style={isSelected ? {
                background: 'linear-gradient(rgba(10,10,15,0.9), rgba(10,10,15,0.9)) padding-box, linear-gradient(135deg, #00f0ff, #ff006e) border-box',
                boxShadow: '0 0 20px rgba(0,240,255,0.2), 0 0 0 1px rgba(0,240,255,0.5)'
            } : {}}
        >
            {/* Background Gradient Layer */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            {/* Checkmark */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-neon-cyan text-black rounded-full flex items-center justify-center z-20"
                    >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Provider Info */}
            <div className="relative z-10 flex flex-col items-start text-left">
                <span className="text-3xl mb-1">{icon}</span>
                <span className="text-sm font-medium text-white/90">{name}</span>
            </div>
        </motion.button>
    );
};
