import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ProviderStatus } from '../../../types/settings';

interface ConnectionIndicatorProps {
    status: ProviderStatus;
    showLoading?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ status, showLoading = false }) => {
    if (showLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-xs font-mono text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20"
            >
                <Loader2 className="w-3 h-3 animate-spin" />
                Testing...
            </motion.div>
        );
    }

    if (status.lastCheck === null && !status.error) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                flex items-center gap-2 text-xs font-mono px-2 py-1 rounded-full border
                ${status.connected
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                }
            `}
        >
            {status.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{status.connected ? 'Connected' : 'Offline'}</span>
        </motion.div>
    );
};
