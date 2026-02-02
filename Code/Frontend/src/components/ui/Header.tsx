import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export type SystemStatus = 'idle' | 'loading' | 'error';

interface HeaderProps {
    status?: SystemStatus;
}

export const Header: React.FC<HeaderProps> = ({ status = 'idle' }) => {

    const getStatusConfig = (s: SystemStatus) => {
        switch (s) {
            case 'loading':
                return {
                    text: 'Reasoning',
                    icon: RefreshCw,
                    color: 'text-neon-cyan',
                    bgDot: 'bg-neon-cyan',
                    shadow: 'shadow-[0_0_12px_rgba(0,240,255,0.8)]',
                    animateIcon: true
                };
            case 'error':
                return {
                    text: 'System Alert',
                    icon: AlertCircle,
                    color: 'text-neon-magenta',
                    bgDot: 'bg-neon-magenta',
                    shadow: 'shadow-[0_0_12px_rgba(255,0,110,0.8)]',
                    animateIcon: false
                };
            case 'idle':
            default:
                return {
                    text: 'Stable',
                    icon: Sparkles,
                    color: 'text-neon-emerald',
                    bgDot: 'bg-neon-emerald',
                    shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.8)]',
                    animateIcon: false
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b border-border"
        >
            <div className="text-center md:text-left space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${config.bgDot} ${config.shadow} animate-pulse-neon`} />
                    </div>
                    <span className={`text-[11px] font-bold tracking-[0.2em] uppercase font-mono ${config.color}`}>
                        System {config.text}
                    </span>
                    <div className="h-4 w-px bg-border mx-1" />
                    <div className="px-2 py-0.5 rounded-md bg-secondary/50 border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider">v3.0.4 - STABLE</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h1 className="text-[42px] leading-tight font-extrabold tracking-tight text-foreground drop-shadow-2xl">
                        AutoLogic <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-magenta">Framework</span>
                    </h1>
                    <p className="text-[14px] text-muted-foreground font-medium tracking-wide">
                        Advanced Reasoning Architecture & Cross-Agent Coordination
                    </p>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
                {status === 'loading' && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="p-3 rounded-full bg-neon-cyan/5 border border-neon-cyan/20"
                    >
                        <RefreshCw className="w-5 h-5 text-neon-cyan" />
                    </motion.div>
                )}
            </div>
        </motion.header>
    );
};

